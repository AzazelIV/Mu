// Browser-only replacements for native window/security callbacks.
// The WebAssembly client uses the browser canvas instead of a Win32 OpenGL
// context and does not ship the desktop GameGuard process.
void OpenGL_Release(void) {
    // The browser owns the WebGL context and releases it with the canvas.
}

void GameGuard_TickCheck(void) {
    // GameGuard is not available in the browser build.
}
