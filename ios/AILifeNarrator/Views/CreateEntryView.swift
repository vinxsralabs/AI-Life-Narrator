import SwiftUI
import AVFoundation
import PhotosUI

struct CreateEntryView: View {
    @EnvironmentObject var dataManager: DataManager
    @StateObject private var apiService = APIService()
    @Environment(\.dismiss) private var dismiss
    
    @State private var textContent = ""
    @State private var selectedImages: [UIImage] = []
    @State private var audioRecorder: AVAudioRecorder?
    @State private var isRecording = false
    @State private var recordingTime: TimeInterval = 0
    @State private var recordingTimer: Timer?
    @State private var audioURL: URL?
    @State private var isPlaying = false
    @State private var audioPlayer: AVAudioPlayer?
    
    @State private var isSubmitting = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @State private var showingImagePicker = false
    @State private var showingCamera = false
    
    private let maxImages = 5
    private let maxTextLength = 500
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 25) {
                    // Text Input Section
                    TextInputSection(
                        textContent: $textContent,
                        maxLength: maxTextLength
                    )
                    
                    // Image Capture Section
                    ImageCaptureSection(
                        selectedImages: $selectedImages,
                        maxImages: maxImages,
                        showingImagePicker: $showingImagePicker,
                        showingCamera: $showingCamera
                    )
                    
                    // Audio Recording Section
                    AudioRecordingSection(
                        isRecording: $isRecording,
                        recordingTime: $recordingTime,
                        audioURL: $audioURL,
                        isPlaying: $isPlaying,
                        onStartRecording: startRecording,
                        onStopRecording: stopRecording,
                        onPlayAudio: playAudio,
                        onStopAudio: stopAudio
                    )
                    
                    // Submit Button
                    SubmitButton(
                        isSubmitting: $isSubmitting,
                        hasContent: hasContent,
                        onSubmit: submitEntry
                    )
                }
                .padding()
            }
            .navigationTitle("Create Entry")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(selectedImages: $selectedImages, maxImages: maxImages)
            }
            .sheet(isPresented: $showingCamera) {
                CameraView(selectedImages: $selectedImages, maxImages: maxImages)
            }
            .alert("Entry Creation", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
            .onAppear {
                setupAudioSession()
            }
        }
    }
    
    private var hasContent: Bool {
        !textContent.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ||
        !selectedImages.isEmpty ||
        audioURL != nil
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set up audio session: \(error)")
        }
    }
    
    private func startRecording() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let audioFilename = documentsPath.appendingPathComponent("recording_\(Date().timeIntervalSince1970).m4a")
        
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 44100,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.high.rawValue
        ]
        
        do {
            audioRecorder = try AVAudioRecorder(url: audioFilename, settings: settings)
            audioRecorder?.delegate = nil
            audioRecorder?.record()
            
            isRecording = true
            recordingTime = 0
            audioURL = audioFilename
            
            // Start timer
            recordingTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
                recordingTime += 1
            }
        } catch {
            print("Failed to start recording: \(error)")
        }
    }
    
    private func stopRecording() {
        audioRecorder?.stop()
        isRecording = false
        recordingTimer?.invalidate()
        recordingTimer = nil
    }
    
    private func playAudio() {
        guard let audioURL = audioURL else { return }
        
        do {
            audioPlayer = try AVAudioPlayer(contentsOf: audioURL)
            audioPlayer?.delegate = nil
            audioPlayer?.play()
            isPlaying = true
        } catch {
            print("Failed to play audio: \(error)")
        }
    }
    
    private func stopAudio() {
        audioPlayer?.stop()
        isPlaying = false
    }
    
    private func submitEntry() {
        guard hasContent else { return }
        
        isSubmitting = true
        
        Task {
            do {
                // Create entry first
                let entry = try await apiService.createEntry(
                    textContent: textContent.isEmpty ? nil : textContent,
                    storyStyle: "story"
                )
                
                // Upload images if any
                for image in selectedImages {
                    try await apiService.uploadImage(
                        image: image,
                        entryId: entry.id,
                        description: nil
                    )
                }
                
                // Upload audio if any
                if let audioURL = audioURL {
                    try await apiService.uploadAudio(
                        audioURL: audioURL,
                        entryId: entry.id
                    )
                }
                
                DispatchQueue.main.async {
                    isSubmitting = false
                    alertMessage = "Entry created successfully!"
                    showingAlert = true
                    
                    // Clear form
                    textContent = ""
                    selectedImages = []
                    self.audioURL = nil
                    recordingTime = 0
                    
                    // Dismiss after a short delay
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        dismiss()
                    }
                }
                
            } catch {
                DispatchQueue.main.async {
                    isSubmitting = false
                    alertMessage = "Failed to create entry: \(error.localizedDescription)"
                    showingAlert = true
                }
            }
        }
    }
}

// MARK: - Text Input Section
struct TextInputSection: View {
    @Binding var textContent: String
    let maxLength: Int
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "pencil")
                    .foregroundColor(.blue)
                Text("What's on your mind?")
                    .font(.headline)
                Spacer()
            }
            
            TextEditor(text: $textContent)
                .frame(minHeight: 120)
                .padding(8)
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(.systemGray4), lineWidth: 1)
                )
            
            HStack {
                Spacer()
                Text("\(textContent.count)/\(maxLength)")
                    .font(.caption)
                    .foregroundColor(textContent.count > maxLength ? .red : .secondary)
            }
        }
    }
}

// MARK: - Image Capture Section
struct ImageCaptureSection: View {
    @Binding var selectedImages: [UIImage]
    let maxImages: Int
    @Binding var showingImagePicker: Bool
    @Binding var showingCamera: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "camera")
                    .foregroundColor(.green)
                Text("Add Photos")
                    .font(.headline)
                Spacer()
            }
            
            if selectedImages.isEmpty {
                HStack(spacing: 15) {
                    Button(action: { showingCamera = true }) {
                        VStack(spacing: 8) {
                            Image(systemName: "camera.fill")
                                .font(.title2)
                            Text("Camera")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                    }
                    
                    Button(action: { showingImagePicker = true }) {
                        VStack(spacing: 8) {
                            Image(systemName: "photo.on.rectangle")
                                .font(.title2)
                            Text("Library")
                                .font(.caption)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                    }
                }
            } else {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 10) {
                        ForEach(Array(selectedImages.enumerated()), id: \.offset) { index, image in
                            ImageThumbnailView(
                                image: image,
                                onRemove: {
                                    selectedImages.remove(at: index)
                                }
                            )
                        }
                        
                        if selectedImages.count < maxImages {
                            Button(action: { showingImagePicker = true }) {
                                VStack(spacing: 8) {
                                    Image(systemName: "plus")
                                        .font(.title2)
                                    Text("Add More")
                                        .font(.caption)
                                }
                                .frame(width: 80, height: 80)
                                .background(Color(.systemGray6))
                                .cornerRadius(10)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
            }
            
            Text("\(selectedImages.count)/\(maxImages) images")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Image Thumbnail View
struct ImageThumbnailView: View {
    let image: UIImage
    let onRemove: () -> Void
    
    var body: some View {
        ZStack(alignment: .topTrailing) {
            Image(uiImage: image)
                .resizable()
                .aspectRatio(contentMode: .fill)
                .frame(width: 80, height: 80)
                .clipped()
                .cornerRadius(10)
            
            Button(action: onRemove) {
                Image(systemName: "xmark.circle.fill")
                    .foregroundColor(.white)
                    .background(Color.black.opacity(0.7))
                    .clipShape(Circle())
            }
            .offset(x: 5, y: -5)
        }
    }
}

// MARK: - Audio Recording Section
struct AudioRecordingSection: View {
    @Binding var isRecording: Bool
    @Binding var recordingTime: TimeInterval
    @Binding var audioURL: URL?
    @Binding var isPlaying: Bool
    let onStartRecording: () -> Void
    let onStopRecording: () -> Void
    let onPlayAudio: () -> Void
    let onStopAudio: () -> Void
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "mic")
                    .foregroundColor(.orange)
                Text("Voice Recording")
                    .font(.headline)
                Spacer()
            }
            
            if audioURL == nil {
                Button(action: isRecording ? onStopRecording : onStartRecording) {
                    HStack {
                        Image(systemName: isRecording ? "stop.circle.fill" : "mic.circle.fill")
                            .font(.title2)
                        Text(isRecording ? "Stop Recording" : "Start Recording")
                            .fontWeight(.medium)
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isRecording ? Color.red : Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                
                if isRecording {
                    Text(formatTime(recordingTime))
                        .font(.title2)
                        .fontWeight(.semibold)
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity)
                }
            } else {
                HStack(spacing: 15) {
                    Button(action: isPlaying ? onStopAudio : onPlayAudio) {
                        HStack {
                            Image(systemName: isPlaying ? "stop.circle.fill" : "play.circle.fill")
                                .font(.title2)
                            Text(isPlaying ? "Stop" : "Play")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isPlaying ? Color.red : Color.green)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                    
                    Button(action: {
                        audioURL = nil
                        recordingTime = 0
                    }) {
                        HStack {
                            Image(systemName: "trash.circle.fill")
                                .font(.title2)
                            Text("Delete")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                    }
                }
            }
        }
    }
    
    private func formatTime(_ time: TimeInterval) -> String {
        let minutes = Int(time) / 60
        let seconds = Int(time) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

// MARK: - Submit Button
struct SubmitButton: View {
    @Binding var isSubmitting: Bool
    let hasContent: Bool
    let onSubmit: () -> Void
    
    var body: some View {
        Button(action: onSubmit) {
            HStack {
                if isSubmitting {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Image(systemName: "paperplane.fill")
                }
                
                Text(isSubmitting ? "Creating..." : "Create Entry")
                    .fontWeight(.semibold)
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(hasContent ? Color.blue : Color.gray)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .disabled(!hasContent || isSubmitting)
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var selectedImages: [UIImage]
    let maxImages: Int
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var configuration = PHPickerConfiguration()
        configuration.filter = .images
        configuration.selectionLimit = maxImages - selectedImages.count
        
        let picker = PHPickerViewController(configuration: configuration)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            
            for result in results {
                result.itemProvider.loadObject(ofClass: UIImage.self) { image, error in
                    if let image = image as? UIImage {
                        DispatchQueue.main.async {
                            self.parent.selectedImages.append(image)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Camera View
struct CameraView: UIViewControllerRepresentable {
    @Binding var selectedImages: [UIImage]
    let maxImages: Int
    
    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.delegate = context.coordinator
        picker.sourceType = .camera
        return picker
    }
    
    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: CameraView
        
        init(_ parent: CameraView) {
            self.parent = parent
        }
        
        func imagePickerController(_ picker: UIImagePickerController, didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey : Any]) {
            if let image = info[.originalImage] as? UIImage {
                parent.selectedImages.append(image)
            }
            picker.dismiss(animated: true)
        }
        
        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            picker.dismiss(animated: true)
        }
    }
}

#Preview {
    CreateEntryView()
        .environmentObject(DataManager())
} 