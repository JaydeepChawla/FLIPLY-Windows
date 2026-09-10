/**
 * FLIPLY — Native Win32 Screen Saver (.scr) Wrapper
 * Language: C++ (Win32 API / MSVC or MinGW)
 * Compile: cl.exe /O2 /Fe:FLIPLY.scr wrapper.cpp user32.lib gdi32.lib shell32.lib
 */

#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <shellapi.h>
#include <string>

static POINT g_initialMousePos = { -1, -1 };
static HWND g_previewHwnd = NULL;

LRESULT CALLBACK ScreenSaverWndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    switch (msg) {
        case WM_CREATE:
            ShowCursor(FALSE);
            return 0;

        case WM_MOUSEMOVE: {
            int x = LOWORD(lParam);
            int y = HIWORD(lParam);
            if (g_initialMousePos.x == -1 && g_initialMousePos.y == -1) {
                g_initialMousePos.x = x;
                g_initialMousePos.y = y;
            } else {
                if (abs(x - g_initialMousePos.x) > 10 || abs(y - g_initialMousePos.y) > 10) {
                    PostMessage(hwnd, WM_CLOSE, 0, 0);
                }
            }
            return 0;
        }

        case WM_LBUTTONDOWN:
        case WM_RBUTTONDOWN:
        case WM_MBUTTONDOWN:
        case WM_KEYDOWN:
        case WM_SYSKEYDOWN:
            PostMessage(hwnd, WM_CLOSE, 0, 0);
            return 0;

        case WM_PAINT: {
            PAINTSTRUCT ps;
            HDC hdc = BeginPaint(hwnd, &ps);
            RECT rect;
            GetClientRect(hwnd, &rect);

            // Background
            HBRUSH bgBrush = CreateSolidBrush(RGB(5, 5, 5));
            FillRect(hdc, &rect, bgBrush);
            DeleteObject(bgBrush);

            // Current Time
            SYSTEMTIME st;
            GetLocalTime(&st);
            wchar_t timeBuffer[64];
            wsprintfW(timeBuffer, L"%02d : %02d : %02d", st.wHour, st.wMinute, st.wSecond);

            SetBkMode(hdc, TRANSPARENT);
            SetTextColor(hdc, RGB(235, 235, 235));

            HFONT hFont = CreateFontW(
                rect.bottom / 8, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
                DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
                CLEARTYPE_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI"
            );
            HGDIOBJ oldFont = SelectObject(hdc, hFont);

            DrawTextW(hdc, timeBuffer, -1, &rect, DT_CENTER | DT_VCENTER | DT_SINGLELINE);

            SelectObject(hdc, oldFont);
            DeleteObject(hFont);

            EndPaint(hwnd, &ps);
            return 0;
        }

        case WM_DESTROY:
            ShowCursor(TRUE);
            PostQuitMessage(0);
            return 0;
    }
    return DefWindowProc(hwnd, msg, wParam, lParam);
}

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE, LPSTR lpCmdLine, int) {
    std::string cmd = lpCmdLine ? lpCmdLine : "";
    
    // Trim leading spaces
    size_t firstNonSpace = cmd.find_first_not_of(" \t");
    if (firstNonSpace != std::string::npos) {
        cmd = cmd.substr(firstNonSpace);
    }

    char flag = 's';
    if (!cmd.empty() && (cmd[0] == '/' || cmd[0] == '-')) {
        flag = tolower(cmd[1]);
    }

    if (flag == 'c') {
        // Configuration: launch FLIPLY.exe --screensaver-config
        ShellExecuteA(NULL, "open", "FLIPLY.exe", "--screensaver-config", NULL, SW_SHOWNORMAL);
        return 0;
    }

    // Try launching full Electron screen saver
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    std::string dir = exePath;
    size_t pos = dir.find_last_of("\\/");
    if (pos != std::string::npos) dir = dir.substr(0, pos);
    std::string electronExe = dir + "\\FLIPLY.exe";

    if (GetFileAttributesA(electronExe.c_str()) != INVALID_FILE_ATTRIBUTES) {
        std::string launchArgs = (flag == 's') ? "--screensaver" : "--screensaver-config";
        HINSTANCE res = ShellExecuteA(NULL, "open", electronExe.c_str(), launchArgs.c_str(), dir.c_str(), SW_SHOW);
        if ((INT_PTR)res > 32) {
            return 0;
        }
    }

    // Fallback Win32 Fullscreen window
    WNDCLASSEX wc = { sizeof(WNDCLASSEX) };
    wc.lpfnWndProc = ScreenSaverWndProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = "FliplyScreenSaverClass";
    wc.hCursor = NULL;
    RegisterClassEx(&wc);

    HWND hwnd = CreateWindowEx(
        WS_EX_TOPMOST, "FliplyScreenSaverClass", "FLIPLY",
        WS_POPUP | WS_VISIBLE, 0, 0,
        GetSystemMetrics(SM_CXSCREEN), GetSystemMetrics(SM_CYSCREEN),
        NULL, NULL, hInstance, NULL
    );

    SetTimer(hwnd, 1, 1000, NULL);

    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        if (msg.message == WM_TIMER) {
            InvalidateRect(hwnd, NULL, FALSE);
        }
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    return 0;
}
