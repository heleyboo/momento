import SwiftUI

// Diagonal-striped placeholder for media slots before the real image loads
// (matches the handoff's striped placeholders).
struct StripedPlaceholder: View {
    @Environment(\.palette) private var palette

    var body: some View {
        Canvas { ctx, size in
            ctx.fill(Path(CGRect(origin: .zero, size: size)), with: .color(palette.stripeA))
            let step: CGFloat = 14
            var x: CGFloat = -size.height
            while x < size.width {
                var p = Path()
                p.move(to: CGPoint(x: x, y: size.height))
                p.addLine(to: CGPoint(x: x + size.height, y: 0))
                p.addLine(to: CGPoint(x: x + size.height + step / 2, y: 0))
                p.addLine(to: CGPoint(x: x + step / 2, y: size.height))
                ctx.fill(p, with: .color(palette.stripeB))
                x += step
            }
        }
    }
}
