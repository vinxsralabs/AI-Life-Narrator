// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "AILifeNarrator",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "AILifeNarrator",
            targets: ["AILifeNarrator"]),
    ],
    dependencies: [
        .package(url: "https://github.com/jrendel/SwiftKeychainWrapper.git", from: "4.0.1"),
    ],
    targets: [
        .target(
            name: "AILifeNarrator",
            dependencies: ["SwiftKeychainWrapper"]),
        .testTarget(
            name: "AILifeNarratorTests",
            dependencies: ["AILifeNarrator"]),
    ]
) 