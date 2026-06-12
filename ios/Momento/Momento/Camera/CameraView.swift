import SwiftUI

// Full-screen capture overlay (black). Photo or video mode; on capture it
// extracts the poster frame and hands a CapturedMedia to the Review step.
struct CameraView: View {
    // Hands one captured item back, then the camera closes.
    let onCaptured: (CapturedMedia) -> Void
    let onFinished: () -> Void

    @Environment(\.palette) private var palette
    @State private var controller = CameraController()
    @State private var mode: Mode = .photo
    @State private var flashFrame = false
    @State private var busy = false

    enum Mode { case photo, video }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            CameraPreview(session: controller.session).ignoresSafeArea()
            if flashFrame { Color.white.ignoresSafeArea().transition(.opacity) }

            VStack {
                topBar
                Spacer()
                hintPill
                modeToggle
                captureRow.padding(.bottom, 30)
            }
            .padding(.horizontal, 20)
        }
        .task { await controller.configure() }
        .onDisappear { controller.stop() }
    }

    private var topBar: some View {
        HStack {
            glassButton("xmark") { onFinished() }
            Spacer()
            glassButton(controller.flashOn ? "bolt.fill" : "bolt.slash") { controller.flashOn.toggle() }
        }
        .padding(.top, 12)
    }

    private var hintPill: some View {
        Label("AI sẽ tự viết caption sau khi chụp", systemImage: "sparkles")
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(.white)
            .padding(.horizontal, 14).padding(.vertical, 8)
            .background(.black.opacity(0.42), in: Capsule())
            .padding(.bottom, 16)
    }

    private var modeToggle: some View {
        HStack(spacing: 22) {
            modeLabel("ẢNH", .photo)
            modeLabel("VIDEO", .video)
        }
        .padding(.bottom, 18)
    }

    private func modeLabel(_ text: String, _ value: Mode) -> some View {
        Button { mode = value } label: {
            Text(text)
                .font(.system(size: 13, weight: .bold)).kerning(1.2)
                .foregroundStyle(mode == value ? palette.accent : .white.opacity(0.62))
        }
        .disabled(controller.isRecording)
    }

    private var captureRow: some View {
        HStack {
            Color.clear.frame(width: 48, height: 48) // library slot (Phase: later)
            Spacer()
            captureButton
            Spacer()
            glassButton("arrow.triangle.2.circlepath.camera") { controller.flipCamera() }
                .disabled(controller.isRecording)
        }
    }

    private var captureButton: some View {
        Button(action: capture) {
            ZStack {
                Circle().strokeBorder(.white, lineWidth: 4).frame(width: 78, height: 78)
                if mode == .photo {
                    Circle().fill(.white).frame(width: 64, height: 64)
                } else {
                    RoundedRectangle(cornerRadius: controller.isRecording ? 6 : 9)
                        .fill(Color(red: 1, green: 0.29, blue: 0.24))
                        .frame(width: controller.isRecording ? 32 : 60,
                               height: controller.isRecording ? 32 : 60)
                }
            }
        }
        .disabled(busy)
    }

    private func glassButton(_ icon: String, _ action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold)).foregroundStyle(.white)
                .frame(width: 44, height: 44)
                .background(.black.opacity(0.32), in: Circle())
        }
    }

    private func capture() {
        mode == .photo ? takePhoto() : toggleRecord()
    }

    private func takePhoto() {
        busy = true
        withAnimation(.easeOut(duration: 0.32)) { flashFrame = true }
        Task {
            defer { busy = false; flashFrame = false }
            guard let data = try? await controller.capturePhoto(),
                  let poster = PosterFrame.fromImage(data) else { return }
            onCaptured(CapturedMedia(kind: .photo, mediaData: data, mediaExt: "jpg",
                                     posterData: poster, durationSec: nil))
            onFinished()
        }
    }

    private func toggleRecord() {
        if controller.isRecording {
            Task {
                guard let url = try? await controller.stopRecording(),
                      let (poster, dur) = await PosterFrame.fromVideo(url),
                      let data = try? Data(contentsOf: url) else { return }
                onCaptured(CapturedMedia(kind: .video, mediaData: data, mediaExt: "mov",
                                         posterData: poster, durationSec: dur))
                onFinished()
            }
        } else {
            controller.startRecording()
        }
    }
}
