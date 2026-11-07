#!/usr/bin/env python3
"""Generate a self-contained, textured GLB through Microsoft's TRELLIS.2 Space."""
import argparse
from http.client import HTTPException
import json
import math
import os
from pathlib import Path
import re
import shutil
import struct
import sys
import tempfile
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener
from uuid import uuid4

SPACE = "https://microsoft-trellis-2.hf.space"
API = "/gradio_api"
ASSETS = Path(__file__).resolve().parents[1] / "public/assets/3d"
GENERATE = (
    "image", "seed", "resolution",
    "ss_guidance_strength", "ss_guidance_rescale", "ss_sampling_steps", "ss_rescale_t",
    "shape_slat_guidance_strength", "shape_slat_guidance_rescale",
    "shape_slat_sampling_steps", "shape_slat_rescale_t",
    "tex_slat_guidance_strength", "tex_slat_guidance_rescale",
    "tex_slat_sampling_steps", "tex_slat_rescale_t",
)


class AssetError(Exception):
    pass


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def remote_failure(detail, status=None):
    # Classify the remote message without echoing response bodies or credentials.
    detail = detail.lower()
    if any(word in detail for word in ("quota", "gpu time limit", "gpu time remaining")):
        return AssetError("Hết hạn mức ZeroGPU hoặc thời gian GPU còn lại không đủ.")
    if status in (401, 403):
        return AssetError("Space từ chối xác thực. Kiểm tra quyền và giá trị HF_TOKEN.")
    if status in (429, 502, 503, 504) or any(
        word in detail for word in ("queue is full", "queue full", "too busy", "try again", "no gpu")
    ):
        return AssetError("Space đang bận, giới hạn yêu cầu hoặc tạm thời không khả dụng.")
    if status in (404, 405, 422) or (status and 300 <= status < 400):
        return AssetError(f"API hoặc đường dẫn của Space đã thay đổi (HTTP {status}).")
    if "timeout" in detail or "timed out" in detail:
        return AssetError("Space báo quá thời gian xử lý.")
    return AssetError(
        f"Space trả lỗi HTTP {status}." if status else
        "Space báo tác vụ thất bại mà không cung cấp lỗi phân loại được. Kiểm tra Space và hạn mức."
    )


class SpaceClient:
    def __init__(self, token, timeout):
        self.token = token
        self.timeout = timeout
        self.session = uuid4().hex
        self.opener = build_opener(NoRedirect())

    def request(self, path, body=None, content_type="application/json"):
        headers = {"Content-Type": content_type}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        try:
            return self.opener.open(Request(SPACE + path, body, headers), timeout=self.timeout)
        except HTTPError as exc:
            with exc:
                detail = exc.read(8192).decode("utf-8", errors="replace")
            raise remote_failure(detail, exc.code) from None

    def read_json(self, path, payload=None):
        body = None if payload is None else json.dumps(payload).encode()
        with self.request(path, body) as response:
            return json.load(response)

    def upload(self, path, mime_type):
        boundary = uuid4().hex
        filename = "reference.png" if mime_type == "image/png" else "reference.jpg"
        header = (
            f'--{boundary}\r\nContent-Disposition: form-data; name="files"; '
            f'filename="{filename}"\r\nContent-Type: {mime_type}\r\n\r\n'
        ).encode()
        body = header + path.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
        with self.request(f"{API}/upload", body, f"multipart/form-data; boundary={boundary}") as response:
            paths = json.load(response)
        if not isinstance(paths, list) or len(paths) != 1 or not isinstance(paths[0], str):
            raise AssetError("API upload trả dữ liệu khác schema dự kiến.")
        return {"path": paths[0], "orig_name": filename, "meta": {"_type": "gradio.FileData"}}

    def run(self, name, index, data):
        print(f"Đang chờ /{name}…", flush=True)
        deadline = time.monotonic() + self.timeout
        joined = self.read_json(f"{API}/queue/join", {
            "data": data, "fn_index": index, "session_hash": self.session,
        })
        event_id = joined.get("event_id")
        if not event_id:
            raise remote_failure(json.dumps(joined, ensure_ascii=False))
        query = urlencode({"session_hash": self.session})
        result = None
        with self.request(f"{API}/queue/data?{query}") as response:
            if response.headers.get_content_type() != "text/event-stream":
                raise AssetError("API queue không trả luồng SSE như dự kiến.")
            fields = []
            for line in response:
                if time.monotonic() >= deadline:
                    raise TimeoutError
                if line.startswith(b"data:"):
                    fields.append(line[5:].strip())
                if line.strip() or not fields:
                    continue
                event = json.loads(b"\n".join(fields))
                fields.clear()
                message = event.get("msg")
                if message in ("queue_full", "unexpected_error", "server_stopped"):
                    raise remote_failure(json.dumps(event, ensure_ascii=False), 503 if message != "unexpected_error" else None)
                if message == "close_stream":
                    break
                if message == "process_completed" and event.get("event_id") == event_id:
                    if not event.get("success"):
                        raise remote_failure(json.dumps(event, ensure_ascii=False))
                    # Let Gradio close this stream before enqueueing the next event
                    # so disconnect cleanup cannot cancel it under the same session.
                    result = event["output"]["data"]
        if isinstance(result, list):
            return result
        raise AssetError(f"Luồng /{name} đã đóng trước khi nhận kết quả.")

    def download(self, file_data, destination):
        url = urlsplit(file_data["url"])
        if (
            (url.scheme, url.netloc) != ("https", urlsplit(SPACE).netloc)
            or not url.path.startswith(f"{API}/file=")
        ):
            raise AssetError("URL tải GLB khác đường dẫn cùng Space dự kiến.")
        path = url.path + ("?" + url.query if url.query else "")
        with self.request(path) as response, destination.open("wb") as output:
            shutil.copyfileobj(response, output)


def get_contract(client, options):
    schema = client.read_json(f"{API}/info")["named_endpoints"]
    config = client.read_json("/config")
    dependencies = {d["api_name"]: d for d in config["dependencies"]}
    components = {c["id"]: c for c in config["components"]}
    signatures = {
        "start_session": (),
        "preprocess_image": ("input",),
        "image_to_3d": GENERATE,
        "extract_glb": ("decimation_target", "texture_size"),
    }
    endpoints = {}
    controls = {}
    state_outputs = []
    if config["api_prefix"] != API:
        raise AssetError("Tiền tố API của Space đã thay đổi.")
    for name, signature in signatures.items():
        params = schema[f"/{name}"]["parameters"]
        dependency = dependencies[name]
        if tuple(p["parameter_name"] for p in params) != signature or not dependency["queue"]:
            raise AssetError(f"Schema /{name} đã thay đổi. Kiểm tra agents.md và cấu hình Space.")
        inputs = [components[i] for i in dependency["inputs"]]
        state_inputs = [c["id"] for c in inputs if c["type"] == "state"]
        if len(inputs) != len(params) + (name == "extract_glb"):
            raise AssetError(f"Số tham số /{name} đã thay đổi.")
        if name == "image_to_3d":
            state_outputs = [i for i in dependency["outputs"] if components[i]["type"] == "state"]
            if [components[i]["type"] for i in dependency["outputs"]] != ["state", "html"]:
                raise AssetError("Generate không còn trả về State và HTML preview theo thứ tự dự kiến.")
        if name == "extract_glb" and (
            state_inputs != state_outputs or dependency["inputs"][0] != state_outputs[0]
            or [components[i]["type"] for i in dependency["outputs"]] != ["model3d", "downloadbutton"]
        ):
            raise AssetError("State hoặc đầu ra của Extract GLB đã thay đổi.")
        endpoints[name] = dependency["id"]
        controls[name] = {
            p["parameter_name"]: (p, c)
            for p, c in zip(params, (c for c in inputs if c["type"] != "state"))
        }

    settings = {}
    for name, values in (
        ("image_to_3d", {"resolution": options.resolution}),
        ("extract_glb", {"texture_size": options.texture_size, "decimation_target": options.decimation_target}),
    ):
        for key, value in values.items():
            param, component = controls[name][key]
            value = param["parameter_default"] if value is None else value
            props = component["props"]
            if component["type"] == "radio":
                allowed = [choice[1] for choice in props["choices"]]
                if value not in allowed:
                    raise AssetError(f"{key}={value} không hợp lệ. Giá trị cho phép: {allowed}.")
            elif component["type"] == "slider":
                low, high, step = (props[k] for k in ("minimum", "maximum", "step"))
                if not low <= value <= high or (value - low) % step:
                    raise AssetError(f"{key}={value} ngoài phạm vi {low}–{high} hoặc sai bước {step}.")
            else:
                raise AssetError(f"Kiểu control {key} đã thay đổi.")
            settings[key] = value

    sampling = []
    for key in GENERATE[3:]:
        param = controls["image_to_3d"][key][0]
        value = param["parameter_default"]
        if type(value) not in (int, float) or not math.isfinite(value):
            raise AssetError(f"Giá trị mặc định của {key} đã thay đổi.")
        sampling.append(value)
    return endpoints, settings, sampling


def inspect_glb(path):
    with path.open("rb") as file:
        magic, version, length, json_size, chunk_type = struct.unpack("<4sIIII", file.read(20))
        if (magic, version, chunk_type) != (b"glTF", 2, 0x4E4F534A) or length != path.stat().st_size:
            raise AssetError("Header GLB 2.0 không hợp lệ.")
        if json_size % 4 or json_size > min(length - 28, 16 * 1024 * 1024):
            raise AssetError("Kích thước chunk JSON không hợp lệ.")
        document = json.loads(file.read(json_size))
        bin_size, bin_type = struct.unpack("<II", file.read(8))
        if bin_type != 0x004E4942 or bin_size % 4 or file.tell() + bin_size != length:
            raise AssetError("Chunk BIN của GLB không hợp lệ.")
        bin_start = file.tell()
        buffers = document["buffers"]
        if len(buffers) != 1 or "uri" in buffers[0] or not 0 <= bin_size - buffers[0]["byteLength"] <= 3:
            raise AssetError("GLB cần một buffer nhúng hợp lệ.")
        views = document["bufferViews"]
        for view in views:
            offset = view.get("byteOffset", 0)
            if view["buffer"] != 0 or offset < 0 or not 0 < view["byteLength"] <= buffers[0]["byteLength"] - offset:
                raise AssetError("bufferView nằm ngoài buffer nhúng.")
        if any("uri" in image for image in document["images"]):
            raise AssetError("GLB chứa ảnh tham chiếu bên ngoài.")

        def accessor(index, kind, sizes):
            item = document["accessors"][index]
            view = views[item["bufferView"]]
            width = sizes[item["componentType"]]
            offset = item.get("byteOffset", 0)
            stride = view.get("byteStride", width)
            if (item["type"] != kind or item["count"] <= 0 or offset < 0 or stride < width
                    or offset + (item["count"] - 1) * stride + width > view["byteLength"]):
                raise AssetError(f"Accessor {kind} không hợp lệ.")
            return item

        def texture_image(reference):
            texture = document["textures"][reference["index"]]
            source = texture.get("extensions", {}).get("EXT_texture_webp", {}).get("source", texture.get("source"))
            image = document["images"][source]
            view = views[image["bufferView"]]
            file.seek(bin_start + view.get("byteOffset", 0))
            header = file.read(min(view["byteLength"], 12))
            if not (
                (image["mimeType"] == "image/webp" and header[:4] == b"RIFF" and header[8:12] == b"WEBP")
                or (image["mimeType"] == "image/png" and header.startswith(b"\x89PNG\r\n\x1a\n"))
                or (image["mimeType"] == "image/jpeg" and header.startswith(b"\xff\xd8\xff"))
            ):
                raise AssetError("Texture nhúng không khớp MIME hoặc định dạng được hỗ trợ.")
            return source

        nodes = document["nodes"]
        pending = list(document["scenes"][document.get("scene", 0)]["nodes"])
        seen = set()
        meshes = set()
        skinned = 0
        while pending:
            index = pending.pop()
            if index in seen:
                raise AssetError("Scene có node trùng hoặc vòng lặp.")
            seen.add(index)
            node = nodes[index]
            pending.extend(node.get("children", []))
            if "mesh" in node:
                meshes.add(node["mesh"])
                skinned += "skin" in node

        triangles = 0
        materials = set()
        images = set()
        for index in meshes:
            for primitive in document["meshes"][index]["primitives"]:
                attributes = primitive["attributes"]
                position = accessor(attributes["POSITION"], "VEC3", {5126: 12})
                count = position["count"]
                if "indices" in primitive:
                    indices = accessor(primitive["indices"], "SCALAR", {5121: 1, 5123: 2, 5125: 4})
                    count = indices["count"]
                    if indices.get("max", [position["count"] - 1])[0] >= position["count"]:
                        raise AssetError("Chỉ số tam giác vượt số đỉnh.")
                if primitive.get("mode", 4) != 4 or count % 3:
                    raise AssetError("Mesh TRELLIS phải dùng danh sách tam giác.")
                triangles += count // 3
                material = primitive["material"]
                materials.add(material)
                pbr = document["materials"][material]["pbrMetallicRoughness"]
                for texture in (pbr["baseColorTexture"], pbr.get("metallicRoughnessTexture")):
                    if texture is not None:
                        uv = accessor(attributes[f"TEXCOORD_{texture.get('texCoord', 0)}"], "VEC2", {5126: 8})
                        if uv["count"] != position["count"]:
                            raise AssetError("Số UV không khớp số đỉnh.")
                        images.add(texture_image(texture))
    if document["asset"]["version"] != "2.0" or not triangles or not images:
        raise AssetError("GLB thiếu mesh tam giác hoặc texture vật liệu.")
    return {
        "meshes": len(meshes), "triangles": triangles, "materials": len(materials),
        "embedded_textures": len(images), "skins": len(document.get("skins", [])),
        "skinned_nodes": skinned, "animations": len(document.get("animations", [])),
    }


def generate(args):
    if not args.image or not args.name:
        raise AssetError("Cần truyền đường dẫn ảnh và tên asset.")
    if not re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9_-]*(/[a-zA-Z0-9][a-zA-Z0-9_-]*)*", args.name):
        raise AssetError("Tên asset chỉ dùng chữ ASCII, số, dấu gạch và thư mục con, bỏ đuôi .glb.")
    target = ASSETS / (args.name + ".glb")
    if not target.resolve().is_relative_to(ASSETS.resolve()):
        raise AssetError("Đường dẫn asset phải nằm trong public/assets/3d.")
    if target.exists():
        raise AssetError(f"Đích đã tồn tại: {target}")
    if not args.image.is_file():
        raise AssetError(f"Không tìm thấy ảnh. Đặt file tại: {args.image.resolve()}")
    with args.image.open("rb") as file:
        header = file.read(8)
    if args.image.suffix.lower() == ".png" and header == b"\x89PNG\r\n\x1a\n":
        mime = "image/png"
    elif args.image.suffix.lower() in (".jpg", ".jpeg") and header.startswith(b"\xff\xd8\xff"):
        mime = "image/jpeg"
    else:
        raise AssetError("Đầu vào phải là ảnh PNG hoặc JPEG.")
    token = os.environ.get("HF_TOKEN", "").strip()
    if not token:
        raise AssetError("Thiếu HF_TOKEN trong môi trường. Chưa gửi ảnh hoặc gọi ZeroGPU.")
    target.parent.mkdir(parents=True, exist_ok=True)
    client = SpaceClient(token, args.timeout)
    endpoints, settings, sampling = get_contract(client, args)
    client.run("start_session", endpoints["start_session"], [])
    uploaded = client.upload(args.image, mime)
    image, = client.run("preprocess_image", endpoints["preprocess_image"], [uploaded])
    if not isinstance(image, dict) or not image.get("path"):
        raise AssetError("Preprocess không trả về Image FileData.")
    state, preview = client.run("image_to_3d", endpoints["image_to_3d"], [
        image, args.seed, settings["resolution"], *sampling,
    ])
    if state is not None or not isinstance(preview, str):
        raise AssetError("Generate không trả State ẩn và HTML preview như dự kiến.")
    _, download = client.run("extract_glb", endpoints["extract_glb"], [
        None, settings["decimation_target"], settings["texture_size"],
    ])
    with tempfile.TemporaryDirectory(dir=target.parent) as folder:
        temporary = Path(folder) / "asset.glb"
        client.download(download, temporary)
        stats = inspect_glb(temporary)
        # Publish atomically and refuse to overwrite even if another process won the race.
        os.link(temporary, target)
    print(f"{target}\n{json.dumps(stats)}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("image", type=Path, nargs="?")
    parser.add_argument("name", nargs="?", help="Ví dụ: characters/chibi-red-7")
    action = parser.add_mutually_exclusive_group()
    action.add_argument("--inspect", type=Path, help="Kiểm tra GLB có sẵn, không gọi Space")
    action.add_argument("--check-api", action="store_true", help="Đọc schema/config, không gọi ZeroGPU")
    parser.add_argument("--resolution")
    parser.add_argument("--texture-size", type=int)
    parser.add_argument("--decimation-target", type=int)
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--timeout", type=int, default=600, help="Giây chờ mỗi bước queue/request")
    args = parser.parse_args()
    if args.timeout <= 0 or not 0 <= args.seed <= 2147483647:
        parser.error("--timeout phải dương và --seed phải thuộc 0–2147483647")
    if (args.inspect or args.check_api) and (args.image or args.name):
        parser.error("--inspect và --check-api không nhận ảnh hoặc tên asset")
    try:
        if args.inspect:
            print(json.dumps(inspect_glb(args.inspect)))
        elif args.check_api:
            _, settings, _ = get_contract(SpaceClient(None, args.timeout), args)
            print(json.dumps(settings))
        else:
            generate(args)
    except (TimeoutError, URLError) as exc:
        timed_out = isinstance(exc, TimeoutError) or isinstance(getattr(exc, "reason", None), TimeoutError)
        print("Lỗi: Hết thời gian chờ." if timed_out else "Lỗi: Không kết nối được với Space.", file=sys.stderr)
    except AssetError as exc:
        print(f"Lỗi: {exc}", file=sys.stderr)
    except (OSError, HTTPException):
        print("Lỗi: Không đọc/ghi được file hoặc kết nối đã ngắt.", file=sys.stderr)
    except (LookupError, ValueError, TypeError, AttributeError, struct.error):
        print("Lỗi: API trả dữ liệu khác dự kiến hoặc GLB không hợp lệ.", file=sys.stderr)
    else:
        return 0
    if not (args.inspect or args.check_api):
        print("Script không tự gửi lại tác vụ. Kiểm tra Space trước khi chạy lại.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
