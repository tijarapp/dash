APP ICON PACKAGE

Flutter in-app asset:
- logo-transparent-1024.png

Store uploads:
- app-icon-ios-1024.png: Apple App Store icon (opaque, no alpha)
- google-play-icon-512.png: Google Play listing icon

Android adaptive icon:
- android-adaptive-foreground-432.png: transparent foreground
- android-adaptive-background-432.png: solid background layer

Flutter setup:
1. Copy the PNG files into assets/icon/ in the Flutter project.
2. Copy flutter_launcher_icons.yaml to the project root.
3. Add flutter_launcher_icons under dev_dependencies in pubspec.yaml.
4. Run: dart run flutter_launcher_icons

Important:
Apple does not accept transparency in App Store icons. Use the transparent
logo only inside the Flutter application, and use app-icon-ios-1024.png for iOS.
