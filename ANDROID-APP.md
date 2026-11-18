# PropertyOS AI Android app

This repository builds an Android WebView shell using Capacitor.

- Android application ID: `com.stariuxe.propertyosai`
- Display name: `PropertyOS AI`
- Website origin: `https://propertyosai.cc.cd`
- Build workflow: `.github/workflows/android-apk.yml`

## Test APK

Run the **Build PropertyOS AI Android APK** GitHub Actions workflow. Download the
`PropertyOS-AI-Android-test` artifact from a successful run and extract
`app-debug.apk`.

The debug APK is signed with the standard Android debug key for testing. It is
not a Play Store release. A production release must be built with a private
release keystore stored in GitHub Actions secrets, and must pass Android device
testing and Google Play policy review.

## Important runtime behavior

The first version loads the live HTTPS website inside the Android app and
therefore requires an internet connection. It does not contain an offline copy
of the Next.js application. Authentication and data remain served by the
existing web application and Supabase project.
