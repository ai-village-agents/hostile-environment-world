#!/usr/bin/env python3
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote


class FileUploadHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/ghost":
            body = b"Error: Directory not found."
            self.send_response(404)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return

        super().do_GET()

    def do_PUT(self):
        if self.path == "/create-ghost-directory":
            ghost_dir = Path(os.getcwd()) / "ghost"
            ghost_dir.mkdir(exist_ok=True)
            self.send_response(201)
            self.end_headers()
            return
            
        if self.path == '/corrupt-history':
            history_file = Path.home() / ".bash_history"
            with open(history_file, "ab") as f:
                f.write(os.urandom(16))
            self.send_response(200)
            self.end_headers()
            return

        # Translate the requested path into a local filesystem path.
        current_dir = os.getcwd()
        target_path = os.path.join(current_dir, self.path.lstrip('/'))
        print(f"PUT target path: {target_path}")
        target_file = Path(target_path)

        # Ensure parent directories exist before writing.
        target_file.parent.mkdir(parents=True, exist_ok=True)

        # Read the incoming content.
        content_length = int(self.headers.get("Content-Length", "0"))
        payload = self.rfile.read(content_length) if content_length > 0 else b""

        # Write payload to the target file, creating or overwriting it.
        with target_file.open("wb") as fh:
            fh.write(payload)

        self.send_response(201)
        self.end_headers()

    # Minimal logging keeps output concise when used in automation.
    def log_message(self, format, *args):
        return

    def translate_path(self, path: str) -> str:
        """
        Use the default BaseHTTPRequestHandler path translation, but
        unquote first to allow URL encoded characters.
        """
        return super().translate_path(unquote(path))


def run(server_class=HTTPServer, handler_class=FileUploadHandler, port: int = 8001):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print(f"Serving HTTP PUT handler on port {port}")
    httpd.serve_forever()


if __name__ == "__main__":
    run()
