import SwiftUI

struct TimelineView: View {
    @EnvironmentObject var dataManager: DataManager
    @StateObject private var apiService = APIService()
    @State private var timelineEntries: [TimelineEntry] = []
    @State private var isLoading = true
    @State private var selectedImage: ImageResponse?
    @State private var showingImageModal = false
    
    var body: some View {
        NavigationView {
            Group {
                if isLoading {
                    LoadingView()
                } else if timelineEntries.isEmpty {
                    EmptyTimelineView()
                } else {
                    TimelineContentView(
                        entries: timelineEntries,
                        selectedImage: $selectedImage,
                        showingImageModal: $showingImageModal
                    )
                }
            }
            .navigationTitle("Timeline")
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                loadTimeline()
            }
            .refreshable {
                await refreshTimeline()
            }
        }
        .sheet(isPresented: $showingImageModal) {
            if let image = selectedImage {
                ImageDetailView(image: image)
            }
        }
    }
    
    private func loadTimeline() {
        Task {
            await refreshTimeline()
        }
    }
    
    private func refreshTimeline() async {
        isLoading = true
        
        do {
            let timeline = try await apiService.getTimeline()
            DispatchQueue.main.async {
                self.timelineEntries = timeline.entries
                self.isLoading = false
            }
        } catch {
            DispatchQueue.main.async {
                self.isLoading = false
                // Handle error - could show alert
                print("Error loading timeline: \(error)")
            }
        }
    }
}

// MARK: - Timeline Content View
struct TimelineContentView: View {
    let entries: [TimelineEntry]
    @Binding var selectedImage: ImageResponse?
    @Binding var showingImageModal: Bool
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                ForEach(entries, id: \.date) { entry in
                    TimelineEntryView(
                        entry: entry,
                        selectedImage: $selectedImage,
                        showingImageModal: $showingImageModal
                    )
                }
            }
            .padding()
        }
    }
}

// MARK: - Timeline Entry View
struct TimelineEntryView: View {
    let entry: TimelineEntry
    @Binding var selectedImage: ImageResponse?
    @Binding var showingImageModal: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            // Date Header
            HStack {
                Text(formatDate(entry.date))
                    .font(.headline)
                    .fontWeight(.semibold)
                    .foregroundColor(.primary)
                
                Spacer()
                
                // Entry type indicator
                if entry.entry != nil {
                    Image(systemName: "doc.text.fill")
                        .foregroundColor(.blue)
                } else if !entry.images.isEmpty {
                    Image(systemName: "camera.fill")
                        .foregroundColor(.green)
                } else if !entry.audio_files.isEmpty {
                    Image(systemName: "mic.fill")
                        .foregroundColor(.orange)
                }
            }
            
            // Text Content
            if let textEntry = entry.entry {
                VStack(alignment: .leading, spacing: 8) {
                    if let textContent = textEntry.text_content, !textContent.isEmpty {
                        Text(textContent)
                            .font(.body)
                            .lineLimit(nil)
                            .multilineTextAlignment(.leading)
                    }
                    
                    if let aiStory = textEntry.ai_generated_story, !aiStory.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            HStack {
                                Image(systemName: "sparkles")
                                    .foregroundColor(.yellow)
                                Text("AI Generated Story")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            
                            Text(aiStory)
                                .font(.body)
                                .foregroundColor(.secondary)
                                .lineLimit(3)
                        }
                        .padding(.top, 4)
                    }
                }
            }
            
            // Images Grid
            if !entry.images.isEmpty {
                ImagesGridView(
                    images: entry.images,
                    selectedImage: $selectedImage,
                    showingImageModal: $showingImageModal
                )
            }
            
            // Audio Files
            if !entry.audio_files.isEmpty {
                AudioFilesView(audioFiles: entry.audio_files)
            }
            
            // Timestamp
            Text(formatTimestamp(entry.date))
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
    
    private func formatDate(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .medium
            displayFormatter.timeStyle = .short
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
    
    private func formatTimestamp(_ dateString: String) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSSSS'Z'"
        
        if let date = formatter.date(from: dateString) {
            let displayFormatter = DateFormatter()
            displayFormatter.dateStyle = .none
            displayFormatter.timeStyle = .short
            return displayFormatter.string(from: date)
        }
        
        return dateString
    }
}

// MARK: - Images Grid View
struct ImagesGridView: View {
    let images: [ImageResponse]
    @Binding var selectedImage: ImageResponse?
    @Binding var showingImageModal: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "camera.fill")
                    .foregroundColor(.green)
                Text("\(images.count) image\(images.count != 1 ? "s" : "")")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
            }
            
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                ForEach(images.prefix(6), id: \.id) { image in
                    ImageThumbnailView(
                        image: image,
                        selectedImage: $selectedImage,
                        showingImageModal: $showingImageModal
                    )
                }
                
                if images.count > 6 {
                    // Show overflow indicator
                    VStack {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                            .foregroundColor(.secondary)
                        Text("+\(images.count - 6)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(height: 80)
                    .frame(maxWidth: .infinity)
                    .background(Color(.systemGray5))
                    .cornerRadius(8)
                }
            }
        }
    }
}

// MARK: - Image Thumbnail View
struct ImageThumbnailView: View {
    let image: ImageResponse
    @Binding var selectedImage: ImageResponse?
    @Binding var showingImageModal: Bool
    
    var body: some View {
        Button(action: {
            selectedImage = image
            showingImageModal = true
        }) {
            AsyncImage(url: URL(string: "http://localhost:8000/uploads/images/\(image.filename)")) { phase in
                switch phase {
                case .empty:
                    ProgressView()
                        .frame(height: 80)
                        .frame(maxWidth: .infinity)
                        .background(Color(.systemGray5))
                        .cornerRadius(8)
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 80)
                        .frame(maxWidth: .infinity)
                        .clipped()
                        .cornerRadius(8)
                case .failure:
                    Image(systemName: "photo")
                        .font(.title2)
                        .foregroundColor(.secondary)
                        .frame(height: 80)
                        .frame(maxWidth: .infinity)
                        .background(Color(.systemGray5))
                        .cornerRadius(8)
                @unknown default:
                    EmptyView()
                }
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Audio Files View
struct AudioFilesView: View {
    let audioFiles: [AudioFileResponse]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "mic.fill")
                    .foregroundColor(.orange)
                Text("\(audioFiles.count) audio file\(audioFiles.count != 1 ? "s" : "")")
                    .font(.caption)
                    .foregroundColor(.secondary)
                Spacer()
            }
            
            ForEach(audioFiles, id: \.id) { audioFile in
                AudioFileRow(audioFile: audioFile)
            }
        }
    }
}

// MARK: - Audio File Row
struct AudioFileRow: View {
    let audioFile: AudioFileResponse
    @State private var isPlaying = false
    
    var body: some View {
        HStack {
            Button(action: {
                isPlaying.toggle()
                // TODO: Implement audio playback
            }) {
                Image(systemName: isPlaying ? "pause.circle.fill" : "play.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(audioFile.filename)
                    .font(.caption)
                    .foregroundColor(.primary)
                
                if let transcription = audioFile.transcription, !transcription.isEmpty {
                    Text(transcription)
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                if let duration = audioFile.duration {
                    Text(formatDuration(duration))
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            Spacer()
        }
        .padding(.vertical, 4)
    }
    
    private func formatDuration(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%d:%02d", minutes, remainingSeconds)
    }
}

// MARK: - Image Detail View
struct ImageDetailView: View {
    let image: ImageResponse
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            VStack {
                AsyncImage(url: URL(string: "http://localhost:8000/uploads/images/\(image.filename)")) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    case .failure:
                        Image(systemName: "photo")
                            .font(.largeTitle)
                            .foregroundColor(.secondary)
                    @unknown default:
                        EmptyView()
                    }
                }
                
                if let description = image.description {
                    Text(description)
                        .font(.body)
                        .padding()
                }
                
                Spacer()
            }
            .navigationTitle("Image")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

// MARK: - Empty Timeline View
struct EmptyTimelineView: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "clock")
                .font(.system(size: 60))
                .foregroundColor(.secondary)
            
            Text("No Timeline Entries")
                .font(.title2)
                .fontWeight(.semibold)
            
            Text("Start creating entries to see them appear in your timeline")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Loading View
struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading Timeline...")
                .font(.headline)
                .foregroundColor(.secondary)
                .padding(.top)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    TimelineView()
        .environmentObject(DataManager())
} 