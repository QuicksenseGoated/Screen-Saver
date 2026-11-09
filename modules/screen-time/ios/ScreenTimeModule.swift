import ExpoModulesCore

// FamilyControls, ManagedSettings, and DeviceActivity are not linked.
// Shielding other apps needs the com.apple.developer.family-controls
// entitlement, which Apple approves per developer team. This module
// reports that limit and returns no installed-app list.
public class ScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenTime")

    Function("getCapabilities") { () -> [String: Any] in
      [
        "platform": "ios",
        "canListApps": false,
        "canBlockApps": false,
        "blockReason": "iOS can shield other apps only with the Family Controls entitlement. It is not included here."
      ]
    }

    Function("getLaunchableApps") { () -> [[String: String]] in
      []
    }

    Function("getRecentPackages") { () -> [String] in
      []
    }

    Function("openUsageAccessSettings") { () -> Void in
    }

    Function("openOverlaySettings") { () -> Void in
    }
  }
}
