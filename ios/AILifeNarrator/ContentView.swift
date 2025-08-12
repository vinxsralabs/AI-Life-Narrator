import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    
    var body: some View {
        Group {
            if authManager.isLoading {
                LoadingView()
            } else if authManager.isAuthenticated {
                MainTabView()
            } else {
                LoginView()
            }
        }
    }
}

// MARK: - Loading View
struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
                .scaleEffect(1.5)
            Text("Loading...")
                .font(.headline)
                .foregroundColor(.secondary)
                .padding(.top)
        }
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem {
                    Image(systemName: "house.fill")
                    Text("Home")
                }
            
            TimelineView()
                .tabItem {
                    Image(systemName: "clock.fill")
                    Text("Timeline")
                }
            
            CreateEntryView()
                .tabItem {
                    Image(systemName: "plus.circle.fill")
                    Text("Create")
                }
            
            ProfileView()
                .tabItem {
                    Image(systemName: "person.fill")
                    Text("Profile")
                }
        }
        .accentColor(.blue)
    }
}

// MARK: - Login View
struct LoginView: View {
    @EnvironmentObject var authManager: AuthenticationManager
    @State private var email = ""
    @State private var password = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 30) {
                // App Logo/Title
                VStack(spacing: 20) {
                    Image(systemName: "moon.stars.fill")
                        .font(.system(size: 80))
                        .foregroundColor(.blue)
                    
                    Text("AI Life Narrator")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                    
                    Text("Transform your daily experiences into beautiful narratives")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)
                }
                
                // Login Form
                VStack(spacing: 20) {
                    TextField("Email", text: $email)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                        .disableAutocorrection(true)
                    
                    SecureField("Password", text: $password)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                    
                    Button(action: login) {
                        if authManager.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Sign In")
                                .fontWeight(.semibold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                    .disabled(authManager.isLoading)
                    
                    Button("Create Account") {
                        // Navigate to registration
                    }
                    .foregroundColor(.blue)
                }
                .padding(.horizontal, 40)
                
                Spacer()
            }
            .padding()
            .alert("Login Error", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
        }
    }
    
    private func login() {
        Task {
            do {
                try await authManager.login(email: email, password: password)
            } catch {
                DispatchQueue.main.async {
                    alertMessage = error.localizedDescription
                    showingAlert = true
                }
            }
        }
    }
}

// MARK: - Dashboard View (Port from React Dashboard)
struct DashboardView: View {
    @EnvironmentObject var dataManager: DataManager
    @State private var recentEntries: [Entry] = []
    @State private var isLoading = true
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Welcome Header
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Welcome Home!")
                            .font(.largeTitle)
                            .fontWeight(.bold)
                        
                        Text("Ready to chronicle your day?")
                            .font(.title3)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                    
                    // Quick Create Entry Card
                    QuickCreateCard()
                    
                    // Recent Entries
                    RecentEntriesSection(entries: recentEntries)
                    
                    // Stats Cards
                    StatsSection()
                }
                .padding(.vertical)
            }
            .navigationTitle("Dashboard")
            .navigationBarTitleDisplayMode(.large)
            .onAppear {
                loadRecentEntries()
            }
        }
    }
    
    private func loadRecentEntries() {
        // Load recent entries from Core Data
        let request = Entry.fetchRequest()
        request.sortDescriptors = [NSSortDescriptor(keyPath: \Entry.date, ascending: false)]
        request.fetchLimit = 5
        
        do {
            recentEntries = try dataManager.container.viewContext.fetch(request)
        } catch {
            print("Error fetching recent entries: \(error)")
        }
        
        isLoading = false
    }
}

// MARK: - Quick Create Card
struct QuickCreateCard: View {
    var body: some View {
        VStack(spacing: 15) {
            HStack {
                Image(systemName: "plus.circle.fill")
                    .font(.title2)
                    .foregroundColor(.blue)
                
                Text("Quick Entry")
                    .font(.headline)
                    .fontWeight(.semibold)
                
                Spacer()
            }
            
            Text("Capture your thoughts, record audio, or add photos")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.leading)
            
            HStack(spacing: 15) {
                Button("Text") {
                    // Navigate to text entry
                }
                .buttonStyle(.bordered)
                
                Button("Audio") {
                    // Navigate to audio entry
                }
                .buttonStyle(.bordered)
                
                Button("Photo") {
                    // Navigate to photo entry
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
        .padding(.horizontal)
    }
}

// MARK: - Recent Entries Section
struct RecentEntriesSection: View {
    let entries: [Entry]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Recent Entries")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.horizontal)
            
            if entries.isEmpty {
                Text("No entries yet. Create your first entry!")
                    .foregroundColor(.secondary)
                    .padding()
            } else {
                LazyVStack(spacing: 10) {
                    ForEach(entries, id: \.id) { entry in
                        EntryRowView(entry: entry)
                    }
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Entry Row View
struct EntryRowView: View {
    let entry: Entry
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(entry.date ?? Date(), style: .date)
                    .font(.caption)
                    .foregroundColor(.blue)
                
                Spacer()
                
                if entry.aiGeneratedStory != nil {
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                        .font(.caption)
                }
            }
            
            Text(entry.textContent ?? "No content")
                .font(.body)
                .lineLimit(2)
            
            // Media indicators
            HStack(spacing: 10) {
                if let images = entry.images, !images.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "camera.fill")
                            .font(.caption)
                        Text("\(images.count)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
                
                if let audioFiles = entry.audioFiles, !audioFiles.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mic.fill")
                            .font(.caption)
                        Text("\(audioFiles.count)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

// MARK: - Stats Section
struct StatsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Your Stats")
                .font(.title2)
                .fontWeight(.semibold)
                .padding(.horizontal)
            
            HStack(spacing: 15) {
                StatCard(title: "Total Entries", value: "0", icon: "doc.text.fill")
                StatCard(title: "Stories Generated", value: "0", icon: "sparkles")
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Stat Card
struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
            
            Text(value)
                .font(.title)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(15)
    }
}

// MARK: - Placeholder Views
struct TimelineView: View {
    var body: some View {
        Text("Timeline View - Coming Soon")
            .font(.title)
    }
}

struct CreateEntryView: View {
    var body: some View {
        Text("Create Entry View - Coming Soon")
            .font(.title)
    }
}

struct ProfileView: View {
    var body: some View {
        Text("Profile View - Coming Soon")
            .font(.title)
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthenticationManager())
        .environmentObject(DataManager())
} 