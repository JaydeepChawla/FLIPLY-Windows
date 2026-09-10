// ============================================================
// FLIPLY — Native Windows Screen Saver (.scr) Wrapper
// Language: C# (.NET Framework 4.5+ / Roslyn / csc.exe)
// Compiles directly to: FLIPLY.scr
// ============================================================

using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace FliplyScreenSaver
{
    static class Program
    {
        [DllImport("user32.dll")]
        static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

        [DllImport("user32.dll")]
        static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll", SetLastError = true)]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        static extern bool GetClientRect(IntPtr hWnd, out Rectangle lpRect);

        const int GWL_STYLE = -16;
        const int WS_CHILD = 0x40000000;

        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            if (args.Length > 0)
            {
                string firstArg = args[0].ToLower().Trim();
                string secondArg = null;

                // Handle format: /c:123456 or /p:123456
                if (firstArg.Length > 2)
                {
                    secondArg = firstArg.Substring(3).Trim();
                    firstArg = firstArg.Substring(0, 2);
                }
                else if (args.Length > 1)
                {
                    secondArg = args[1];
                }

                if (firstArg == "/s")
                {
                    // Fullscreen screen saver mode
                    RunScreenSaver();
                }
                else if (firstArg == "/p")
                {
                    // Preview mode inside Windows Screen Saver Settings dialog
                    if (!string.IsNullOrEmpty(secondArg))
                    {
                        IntPtr previewHwnd = new IntPtr(long.Parse(secondArg));
                        Application.Run(new PreviewForm(previewHwnd));
                    }
                }
                else if (firstArg == "/c")
                {
                    // Configuration dialog
                    ShowConfig();
                }
                else
                {
                    // Default to preview/screen saver
                    RunScreenSaver();
                }
            }
            else
            {
                // No arguments: default to configuration or run
                ShowConfig();
            }
        }

        static void RunScreenSaver()
        {
            // Check if FLIPLY.exe exists in the same or application directory
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string electronExe = Path.Combine(appDir, "FLIPLY.exe");

            if (!File.Exists(electronExe))
            {
                // Check parent directories or Program Files
                string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
                string altExe = Path.Combine(programFiles, "Programs", "FLIPLY", "FLIPLY.exe");
                if (File.Exists(altExe))
                {
                    electronExe = altExe;
                }
            }

            if (File.Exists(electronExe))
            {
                // Launch the full high-fidelity FLIPLY Electron application with --screensaver flag
                try
                {
                    ProcessStartInfo psi = new ProcessStartInfo(electronExe, "--screensaver")
                    {
                        UseShellExecute = false,
                        WorkingDirectory = Path.GetDirectoryName(electronExe)
                    };
                    Process p = Process.Start(psi);
                    if (p != null)
                    {
                        p.WaitForExit();
                        return;
                    }
                }
                catch
                {
                    // Fall back to native C# standalone screen saver form
                }
            }

            // Standalone Fallback Screen Saver Form across all monitors
            foreach (Screen screen in Screen.AllScreens)
            {
                ScreenSaverForm ssForm = new ScreenSaverForm(screen.Bounds);
                ssForm.Show();
            }
            Application.Run();
        }

        static void ShowConfig()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string electronExe = Path.Combine(appDir, "FLIPLY.exe");

            if (File.Exists(electronExe))
            {
                try
                {
                    Process.Start(electronExe, "--screensaver-config");
                    return;
                }
                catch { }
            }

            MessageBox.Show(
                "FLIPLY — Flip Clock Screen Saver\n\nConfigure clock options by opening the FLIPLY Desktop App.",
                "FLIPLY Configuration",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );
        }
    }

    /// <summary>
    /// Preview Form embedded inside Windows Screen Saver Settings mini-monitor window
    /// </summary>
    public class PreviewForm : Form
    {
        [DllImport("user32.dll")]
        static extern IntPtr SetParent(IntPtr hWndChild, IntPtr hWndNewParent);

        [DllImport("user32.dll")]
        static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);

        [DllImport("user32.dll", SetLastError = true)]
        static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll")]
        static extern bool GetClientRect(IntPtr hWnd, out Rectangle lpRect);

        private Timer timer;

        public PreviewForm(IntPtr previewHwnd)
        {
            SetParent(this.Handle, previewHwnd);
            SetWindowLong(this.Handle, -16, new IntPtr(GetWindowLong(this.Handle, -16) | 0x40000000).ToInt32());

            Rectangle rect;
            GetClientRect(previewHwnd, out rect);
            this.Size = rect.Size;
            this.Location = new Point(0, 0);

            this.BackColor = Color.FromArgb(10, 10, 10);
            this.DoubleBuffered = true;
            this.FormBorderStyle = FormBorderStyle.None;

            timer = new Timer();
            timer.Interval = 1000;
            timer.Tick += (s, e) => this.Invalidate();
            timer.Start();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;

            DateTime now = DateTime.Now;
            string timeStr = now.ToString("HH : mm : ss");

            using (Font font = new Font("Arial", Math.Max(8, this.Height / 5), FontStyle.Bold))
            using (Brush textBrush = new SolidBrush(Color.FromArgb(235, 235, 235)))
            using (Brush cardBrush = new SolidBrush(Color.FromArgb(26, 26, 26)))
            {
                SizeF size = g.MeasureString(timeStr, font);
                float x = (this.Width - size.Width) / 2;
                float y = (this.Height - size.Height) / 2;

                // Subtle card background in preview
                g.FillRectangle(cardBrush, x - 4, y - 2, size.Width + 8, size.Height + 4);
                g.DrawString(timeStr, font, textBrush, x, y);
            }
        }
    }

    /// <summary>
    /// Standalone ScreenSaver Form with mouse threshold exit detection
    /// </summary>
    public class ScreenSaverForm : Form
    {
        private Point mouseLocation = Point.Empty;
        private Timer tickTimer;

        public ScreenSaverForm(Rectangle bounds)
        {
            this.Bounds = bounds;
            this.StartPosition = FormStartPosition.Manual;
            this.FormBorderStyle = FormBorderStyle.None;
            this.WindowState = FormWindowState.Maximized;
            this.TopMost = true;
            this.BackColor = Color.FromArgb(5, 5, 5);
            this.DoubleBuffered = true;
            Cursor.Hide();

            tickTimer = new Timer();
            tickTimer.Interval = 1000;
            tickTimer.Tick += (s, e) => this.Invalidate();
            tickTimer.Start();
        }

        protected override void OnMouseMove(MouseEventArgs e)
        {
            base.OnMouseMove(e);
            if (mouseLocation.IsEmpty)
            {
                mouseLocation = e.Location;
            }
            else
            {
                // Tolerance threshold to prevent slight table vibrations from exiting
                if (Math.Abs(e.X - mouseLocation.X) > 8 || Math.Abs(e.Y - mouseLocation.Y) > 8)
                {
                    ExitScreenSaver();
                }
            }
        }

        protected override void OnMouseDown(MouseEventArgs e)
        {
            base.OnMouseDown(e);
            ExitScreenSaver();
        }

        protected override void OnKeyDown(KeyEventArgs e)
        {
            base.OnKeyDown(e);
            ExitScreenSaver();
        }

        private void ExitScreenSaver()
        {
            Cursor.Show();
            Application.Exit();
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            Graphics g = e.Graphics;
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;

            DateTime now = DateTime.Now;
            string timeStr = now.ToString("HH : mm : ss");

            using (Font font = new Font("Arial", Math.Max(24, this.Height / 9), FontStyle.Bold))
            using (Brush textBrush = new SolidBrush(Color.FromArgb(240, 240, 240)))
            {
                SizeF size = g.MeasureString(timeStr, font);
                float x = (this.Width - size.Width) / 2;
                float y = (this.Height - size.Height) / 2;
                g.DrawString(timeStr, font, textBrush, x, y);
            }
        }
    }
}
