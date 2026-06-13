import Foundation
import CoreLocation

// Resolved geotag: a short place name + coordinates for the memories map.
struct PlaceInfo {
    let name: String?
    let latitude: Double
    let longitude: Double
}

// One-shot location → place name + coordinates, used to geotag a post when the
// setting is on. Requests When-In-Use permission lazily.
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

    /// Returns the place name + coordinates, or nil if unavailable/denied.
    func place() async -> PlaceInfo? {
        guard await authorize() else { return nil }
        guard let loc = await oneShot() else { return nil }
        return PlaceInfo(name: await name(for: loc),
                         latitude: loc.coordinate.latitude,
                         longitude: loc.coordinate.longitude)
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
