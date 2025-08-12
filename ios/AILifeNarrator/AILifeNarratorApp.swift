import SwiftUI
import CoreData

@main
struct AILifeNarratorApp: App {
    @StateObject private var authManager = AuthenticationManager()
    @StateObject private var dataManager = DataManager()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authManager)
                .environmentObject(dataManager)
                .environment(\.managedObjectContext, dataManager.container.viewContext)
        }
    }
}

// MARK: - Authentication Manager
class AuthenticationManager: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    
    private let keychain = KeychainWrapper.standard
    private let baseURL = "http://localhost:8000/api"
    
    init() {
        // Check for existing token on app launch
        checkExistingToken()
    }
    
    func checkExistingToken() {
        if let token = keychain.string(forKey: "auth_token") {
            // Validate token with backend
            validateToken(token)
        }
    }
    
    func validateToken(_ token: String) {
        isLoading = true
        
        guard let url = URL(string: "\(baseURL)/validate-token") else { return }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                self?.isLoading = false
                
                if let httpResponse = response as? HTTPURLResponse,
                   httpResponse.statusCode == 200 {
                    self?.isAuthenticated = true
                    // Parse user data and set currentUser
                } else {
                    // Token invalid, remove from keychain
                    self?.keychain.removeObject(forKey: "auth_token")
                    self?.isAuthenticated = false
                }
            }
        }.resume()
    }
    
    func login(email: String, password: String) async throws {
        isLoading = true
        
        guard let url = URL(string: "\(baseURL)/login") else {
            throw AuthError.invalidURL
        }
        
        let loginData = ["email": email, "password": password]
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: loginData)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw AuthError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            let tokenResponse = try JSONDecoder().decode(TokenResponse.self, from: data)
            keychain.set(tokenResponse.access_token, forKey: "auth_token")
            isAuthenticated = true
            // Parse and set user data
        } else {
            throw AuthError.invalidCredentials
        }
        
        isLoading = false
    }
    
    func logout() {
        keychain.removeObject(forKey: "auth_token")
        isAuthenticated = false
        currentUser = nil
    }
}

// MARK: - Data Manager
class DataManager: ObservableObject {
    let container: NSPersistentContainer
    
    init() {
        container = NSPersistentContainer(name: "AILifeNarrator")
        
        container.loadPersistentStores { description, error in
            if let error = error {
                print("Core Data failed to load: \(error.localizedDescription)")
            }
        }
        
        container.viewContext.automaticallyMergesChangesFromParent = true
    }
    
    func save() {
        let context = container.viewContext
        
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                print("Error saving context: \(error)")
            }
        }
    }
}

// MARK: - Models
struct TokenResponse: Codable {
    let access_token: String
    let token_type: String
    let user: UserResponse
}

struct UserResponse: Codable {
    let id: Int
    let email: String
    let username: String
    let is_active: Bool
    let created_at: String
}

// MARK: - Errors
enum AuthError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case invalidCredentials
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .invalidCredentials:
            return "Invalid email or password"
        case .networkError:
            return "Network error occurred"
        }
    }
} 