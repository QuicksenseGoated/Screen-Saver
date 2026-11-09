package expo.modules.screentime

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Process
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ScreenTimeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ScreenTime")

    Function("getCapabilities") {
      mapOf(
        "platform" to "android",
        "canListApps" to true,
        "canBlockApps" to false,
        "usageAccess" to hasUsageAccess(),
        "overlay" to Settings.canDrawOverlays(context),
        "blockReason" to "Listing launcher apps works. Interrupting another app needs usage access and a system overlay, which Play policy restricts. This module does not close other apps."
      )
    }

    Function("getLaunchableApps") {
      try {
        val pm = context.packageManager
        val intent = Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER)
        val resolved = pm.queryIntentActivities(intent, 0)
        val seen = linkedMapOf<String, String>()
        for (info in resolved) {
          val id = info.activityInfo?.packageName ?: continue
          if (seen.containsKey(id)) continue
          val name = info.loadLabel(pm)?.toString()?.trim().orEmpty()
          if (name.isEmpty()) continue
          seen[id] = name
        }
        seen.entries
          .sortedBy { it.value.lowercase() }
          .map { mapOf("id" to it.key, "name" to it.value) }
      } catch (_: Exception) {
        emptyList<Map<String, String>>()
      }
    }

    Function("getRecentPackages") {
      if (!hasUsageAccess()) return@Function emptyList<String>()
      try {
        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 86_400_000L, now)
          ?: return@Function emptyList<String>()
        stats
          .sortedByDescending { it.lastTimeUsed }
          .map { it.packageName }
          .distinct()
          .take(40)
      } catch (_: Exception) {
        emptyList<String>()
      }
    }

    Function("openUsageAccessSettings") {
      openSettings(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
    }

    Function("openOverlaySettings") {
      openSettings(
        Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${context.packageName}")
        )
      )
    }
  }

  private fun hasUsageAccess(): Boolean {
    return try {
      val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
      val mode = appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName
      )
      mode == AppOpsManager.MODE_ALLOWED
    } catch (_: Exception) {
      false
    }
  }

  private fun openSettings(intent: Intent) {
    try {
      context.startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    } catch (_: Exception) {
      context.startActivity(Intent(Settings.ACTION_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
  }
}
