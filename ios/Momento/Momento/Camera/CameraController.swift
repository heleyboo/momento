import AVFoundation
import UIKit

struct CapturedMedia: Identifiable {
    enum Kind { case photo, video }
    let id = UUID()
    let kind: Kind
    let mediaData: Data
    let mediaExt: String
    let posterData: Data
    let durationSec: Double?
}

// AVFoundation capture: photo + video, flash, camera flip. Session work runs on
// a serial queue; capture completion is bridged to async via continuations.
@Observable
final class CameraController: NSObject {
    let session = AVCaptureSession()
    var flashOn = false
    var isRecording = false

    private let photoOutput = AVCapturePhotoOutput()
    private let movieOutput = AVCaptureMovieFileOutput()
    private var videoInput: AVCaptureDeviceInput?
    private var position: AVCaptureDevice.Position = .back
    private let queue = DispatchQueue(label: "momento.camera.session")

    private var photoCont: CheckedContinuation<Data, Error>?
    private var movieCont: CheckedContinuation<URL, Error>?

    func configure() async {
        let cam = await AVCaptureDevice.requestAccess(for: .video)
        _ = await AVCaptureDevice.requestAccess(for: .audio)
        guard cam else { return }
        queue.async { [weak self] in self?.setupSession() }
    }

    private func setupSession() {
        session.beginConfiguration()
        session.sessionPreset = .high
        if let device = camera(at: position), let input = try? AVCaptureDeviceInput(device: device) {
            if session.canAddInput(input) { session.addInput(input); videoInput = input }
        }
        if let mic = AVCaptureDevice.default(for: .audio), let micInput = try? AVCaptureDeviceInput(device: mic) {
            if session.canAddInput(micInput) { session.addInput(micInput) }
        }
        if session.canAddOutput(photoOutput) { session.addOutput(photoOutput) }
        if session.canAddOutput(movieOutput) { session.addOutput(movieOutput) }
        session.commitConfiguration()
        session.startRunning()
    }

    func stop() { queue.async { [weak self] in self?.session.stopRunning() } }

    func flipCamera() {
        queue.async { [weak self] in
            guard let self, let current = self.videoInput else { return }
            self.session.beginConfiguration()
            self.session.removeInput(current)
            self.position = self.position == .back ? .front : .back
            if let device = self.camera(at: self.position),
               let input = try? AVCaptureDeviceInput(device: device),
               self.session.canAddInput(input) {
                self.session.addInput(input); self.videoInput = input
            }
            self.session.commitConfiguration()
        }
    }

    func capturePhoto() async throws -> Data {
        let settings = AVCapturePhotoSettings()
        settings.flashMode = flashOn ? .on : .off
        return try await withCheckedThrowingContinuation { cont in
            photoCont = cont
            queue.async { [weak self] in self?.photoOutput.capturePhoto(with: settings, delegate: self!) }
        }
    }

    func startRecording() {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("\(UUID().uuidString).mov")
        queue.async { [weak self] in
            guard let self else { return }
            self.movieOutput.startRecording(to: url, recordingDelegate: self)
            DispatchQueue.main.async { self.isRecording = true }
        }
    }

    func stopRecording() async throws -> URL {
        try await withCheckedThrowingContinuation { cont in
            movieCont = cont
            queue.async { [weak self] in self?.movieOutput.stopRecording() }
        }
    }

    private func camera(at position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: position)
    }
}

extension CameraController: AVCapturePhotoCaptureDelegate {
    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        if let error { photoCont?.resume(throwing: error) }
        else if let data = photo.fileDataRepresentation() { photoCont?.resume(returning: data) }
        else { photoCont?.resume(throwing: CameraError.noData) }
        photoCont = nil
    }
}

extension CameraController: AVCaptureFileOutputRecordingDelegate {
    func fileOutput(_ output: AVCaptureFileOutput, didFinishRecordingTo outputFileURL: URL,
                    from connections: [AVCaptureConnection], error: Error?) {
        DispatchQueue.main.async { self.isRecording = false }
        if let error { movieCont?.resume(throwing: error) }
        else { movieCont?.resume(returning: outputFileURL) }
        movieCont = nil
    }
}

enum CameraError: Error { case noData }
