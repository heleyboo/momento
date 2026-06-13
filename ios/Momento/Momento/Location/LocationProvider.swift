import Foundation
import CoreLocation

// One-shot location → short place name (e.g. "Quận 1, TP. Hồ Chí Minh"), used to
// geotag a post when the setting is on. Requests When-In-Use permission lazily.
@MainActor
final class LocationProvider: NSObject, CLLocationManagerDelegate {
    static let shared = LocationProvider()

    private let manager = CLLocationManager()
    private var authCont: CheckedContinuation<Bool, Never>?
    private var locCont: CheckedContinuation<CLLocation?, Never>?

    override init() {
        super.init()
        manager.delegate = self
    }

    /// Returns a human-readable place name, or nil if unavailable/denied.
    func place() async -> String? {
        guard await authorize() else { return nil }
        guard let loc = await oneShot() else { return nil }
        return await name(for: loc)
    }

    private func authorize() async -> Bool {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways: return true
        case .denied, .restricted: return false
        default:
            return await withCheckedContinuation { cont in
                authCont = cont
                manager.requestWhenInUseAuthorization()
            }
        }
    }

    func locationManagerDidChangeAuthorization(_ m: CLLocationManager) {
        let s = m.authorizationStatus
        // Resume only once the user has actually decided — ignore the delegate-set
        // callback and any pre-decision .notDetermined fire.
        guard s != .notDetermined, let cont = authCont else { return }
        authCont = nil
        cont.resume(returning: s == .authorizedWhenInUse || s == .authorizedAlways)
    }

    private func oneShot() async -> CLLocation? {
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        return await withCheckedContinuation { cont in
            locCont = cont
            manager.requestLocation()
        }
    }

    func locationManager(_ m: CLLocationManager, didUpdateLocations locs: [CLLocation]) {
        locCont?.resume(returning: locs.last)
        locCont = nil
    }

    func locationManager(_ m: CLLocationManager, didFailWithError error: Error) {
        locCont?.resume(returning: nil)
        locCont = nil
    }

    private func name(for loc: CLLocation) async -> String? {
        let marks = try? await CLGeocoder().reverseGeocodeLocation(loc)
        guard let p = marks?.first else { return nil }
        let parts = [p.subAdministrativeArea ?? p.locality, p.administrativeArea].compactMap { $0 }
        return parts.isEmpty ? p.name : parts.joined(separator: ", ")
    }
}
