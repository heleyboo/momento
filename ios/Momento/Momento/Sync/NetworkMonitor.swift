import Foundation
import Network

// Reachability for the sync queue. Tracks online status + whether the path is
// expensive (cellular), so `wifi_only` uploads can be gated.
@MainActor
@Observable
final class NetworkMonitor {
    private(set) var isOnline = false
    private(set) var isExpensive = false

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "momento.network-monitor")

    func start() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isOnline = path.status == .satisfied
                self?.isExpensive = path.isExpensive
            }
        }
        monitor.start(queue: queue)
    }

    /// Whether an upload may proceed given the user's wifi-only preference.
    func canUpload(wifiOnly: Bool) -> Bool {
        isOnline && (!wifiOnly || !isExpensive)
    }
}
