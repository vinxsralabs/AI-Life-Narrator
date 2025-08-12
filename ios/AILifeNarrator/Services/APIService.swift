import Foundation
import UIKit
import AVFoundation

// MARK: - API Service
class APIService: ObservableObject {
    private let baseURL = "http://localhost:8000/api"
    private let keychain = KeychainWrapper.standard
    
    // MARK: - Authentication
    func login(email: String, password: String) async throws -> TokenResponse {
        let url = URL(string: "\(baseURL)/login")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let loginData = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: loginData)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(TokenResponse.self, from: data)
        } else {
            let errorResponse = try JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(errorResponse.detail)
        }
    }
    
    func register(email: String, username: String, password: String) async throws -> TokenResponse {
        let url = URL(string: "\(baseURL)/register")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let registerData = ["email": email, "username": username, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: registerData)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(TokenResponse.self, from: data)
        } else {
            let errorResponse = try JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(errorResponse.detail)
        }
    }
    
    // MARK: - Entries
    func createEntry(textContent: String?, storyStyle: String = "story") async throws -> EntryResponse {
        let url = URL(string: "\(baseURL)/entries")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(getAuthToken())", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let entryData = ["text_content": textContent, "story_style": storyStyle]
        request.httpBody = try JSONSerialization.data(withJSONObject: entryData)
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(EntryResponse.self, from: data)
        } else {
            let errorResponse = try JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(errorResponse.detail)
        }
    }
    
    func getEntries(limit: Int = 10) async throws -> [EntryResponse] {
        let url = URL(string: "\(baseURL)/entries?limit=\(limit)")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(getAuthToken())", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode([EntryResponse].self, from: data)
        } else {
            throw APIError.serverError("Failed to fetch entries")
        }
    }
    
    // MARK: - Timeline
    func getTimeline() async throws -> TimelineResponse {
        let url = URL(string: "\(baseURL)/timeline")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(getAuthToken())", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(TimelineResponse.self, from: data)
        } else {
            throw APIError.serverError("Failed to fetch timeline")
        }
    }
    
    // MARK: - Media Upload
    func uploadImage(image: UIImage, entryId: Int?, description: String?) async throws -> UploadResponse {
        let url = URL(string: "\(baseURL)/upload/image")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(getAuthToken())", forHTTPHeaderField: "Authorization")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add entry_id if provided
        if let entryId = entryId {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"entry_id\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(entryId)\r\n".data(using: .utf8)!)
        }
        
        // Add description if provided
        if let description = description {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"description\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(description)\r\n".data(using: .utf8)!)
        }
        
        // Add image data
        guard let imageData = image.jpegData(compressionQuality: 0.8) else {
            throw APIError.invalidData
        }
        
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
        body.append(imageData)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(UploadResponse.self, from: data)
        } else {
            let errorResponse = try JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(errorResponse.detail)
        }
    }
    
    func uploadAudio(audioURL: URL, entryId: Int?) async throws -> UploadResponse {
        let url = URL(string: "\(baseURL)/upload/audio")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(getAuthToken())", forHTTPHeaderField: "Authorization")
        
        let boundary = UUID().uuidString
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
        
        var body = Data()
        
        // Add entry_id if provided
        if let entryId = entryId {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"entry_id\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(entryId)\r\n".data(using: .utf8)!)
        }
        
        // Add audio data
        let audioData = try Data(contentsOf: audioURL)
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"audio.m4a\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: audio/m4a\r\n\r\n".data(using: .utf8)!)
        body.append(audioData)
        body.append("\r\n".data(using: .utf8)!)
        
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)
        
        request.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(UploadResponse.self, from: data)
        } else {
            let errorResponse = try JSONDecoder().decode(ErrorResponse.self, from: data)
            throw APIError.serverError(errorResponse.detail)
        }
    }
    
    // MARK: - Dashboard Stats
    func getDashboardStats() async throws -> DashboardStatsResponse {
        let url = URL(string: "\(baseURL)/dashboard/stats")!
        var request = URLRequest(url: url)
        request.setValue("Bearer \(getAuthToken())", forHTTPHeaderField: "Authorization")
        
        let (data, response) = try await URLSession.shared.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        if httpResponse.statusCode == 200 {
            return try JSONDecoder().decode(DashboardStatsResponse.self, from: data)
        } else {
            throw APIError.serverError("Failed to fetch dashboard stats")
        }
    }
    
    // MARK: - Helper Methods
    private func getAuthToken() -> String {
        return keychain.string(forKey: "auth_token") ?? ""
    }
}

// MARK: - Response Models
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

struct EntryResponse: Codable {
    let id: Int
    let user_id: Int
    let date: String
    let text_content: String?
    let ai_generated_story: String?
    let story_style: String
    let created_at: String
}

struct TimelineResponse: Codable {
    let entries: [TimelineEntry]
}

struct TimelineEntry: Codable {
    let date: String
    let entry: EntryResponse?
    let audio_files: [AudioFileResponse]
    let images: [ImageResponse]
    let has_content: Bool
}

struct AudioFileResponse: Codable {
    let id: Int
    let user_id: Int
    let entry_id: Int?
    let filename: String
    let file_path: String
    let transcription: String?
    let duration: Int?
    let created_at: String
}

struct ImageResponse: Codable {
    let id: Int
    let user_id: Int
    let entry_id: Int?
    let filename: String
    let file_path: String
    let description: String?
    let ai_generated_illustration: String?
    let created_at: String
}

struct UploadResponse: Codable {
    let message: String
    let entry_id: Int?
    let filename: String
}

struct DashboardStatsResponse: Codable {
    let total_entries: Int
    let stories_generated: Int
    let weekly_streak: Int
    let mem_search_questions: Int
}

struct ErrorResponse: Codable {
    let detail: String
}

// MARK: - API Errors
enum APIError: Error, LocalizedError {
    case invalidURL
    case invalidResponse
    case invalidData
    case serverError(String)
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .invalidData:
            return "Invalid data"
        case .serverError(let message):
            return message
        case .networkError:
            return "Network error occurred"
        }
    }
} 