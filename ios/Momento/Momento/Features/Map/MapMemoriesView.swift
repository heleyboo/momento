import SwiftUI
import SwiftData
import MapKit

// Map of geotagged moments: each post with coordinates is a thumbnail pin; tap
// → open it in the post pager (scoped to the located posts).
struct MapMemoriesView: View {
    @Query(sort: \LocalEntry.takenAt, order: .reverse) private var entries: [LocalEntry]
    @Environment(\.palette) private var palette

    private var located: [LocalEntry] {
        entries.filter { $0.latitude != nil && $0.longitude != nil }
    }

    // Start zoomed out enough to show the whole spread of pins (min ~city-level),
    // not slammed onto a single point.
    private var initialPosition: MapCameraPosition {
        let coords = located.compactMap { e -> CLLocationCoordinate2D? in
            guard let la = e.latitude, let lo = e.longitude else { return nil }
            return CLLocationCoordinate2D(latitude: la, longitude: lo)
        }
        guard !coords.isEmpty else { return .automatic }
        let lats = coords.map(\.latitude), lngs = coords.map(\.longitude)
        let center = CLLocationCoordinate2D(
            latitude: (lats.min()! + lats.max()!) / 2,
            longitude: (lngs.min()! + lngs.max()!) / 2
        )
        let span = MKCoordinateSpan(
            latitudeDelta: max((lats.max()! - lats.min()!) * 1.6, 0.6),
            longitudeDelta: max((lngs.max()! - lngs.min()!) * 1.6, 0.6)
        )
        return .region(MKCoordinateRegion(center: center, span: span))
    }

    var body: some View {
        Group {
            if located.isEmpty {
                empty
            } else {
                Map(initialPosition: initialPosition) {
                    ForEach(located) { entry in
                        Annotation(
                            entry.location ?? "",
                            coordinate: CLLocationCoordinate2D(latitude: entry.latitude ?? 0,
                                                               longitude: entry.longitude ?? 0)
                        ) {
                            NavigationLink {
                                EntryPagerView(entries: located,
                                               startIndex: located.firstIndex { $0.id == entry.id } ?? 0)
                            } label: { pin(entry) }
                        }
                    }
                }
            }
        }
        .navigationTitle("Bản đồ kỷ niệm")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func pin(_ entry: LocalEntry) -> some View {
        EntryImage(media: entry.cover)
            .frame(width: 44, height: 44)
            .clipShape(Circle())
            .overlay(Circle().stroke(.white, lineWidth: 2.5))
            .overlay(alignment: .bottom) {
                if entry.mediaCount > 1 {
                    Text("\(entry.mediaCount)")
                        .font(.system(size: 9, weight: .bold)).foregroundStyle(.white)
                        .padding(.horizontal, 5).padding(.vertical, 1)
                        .background(palette.accent, in: Capsule())
                        .offset(y: 6)
                }
            }
            .shadow(color: .black.opacity(0.25), radius: 3, y: 1)
    }

    private var empty: some View {
        VStack(spacing: 8) {
            Image(systemName: "mappin.slash").font(.system(size: 34)).foregroundStyle(palette.ter)
            Text("Chưa có khoảnh khắc nào gắn vị trí.\nBật \"Gắn vị trí\" trong Cài đặt khi chụp.")
                .multilineTextAlignment(.center).font(Typo.caption).foregroundStyle(palette.sub)
        }
        .padding(40)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(palette.bg.ignoresSafeArea())
    }
}
