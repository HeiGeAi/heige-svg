#!/usr/bin/env python3
"""把 build 产物推到公众号草稿箱。只依赖 Python 标准库。

默认只演练，不联网。加 --send 才会上传素材、创建草稿，并把草稿读回来，
核对 SVG 和动画标签有没有被微信改掉。

凭据从环境变量读取，不要写进命令或文件：
  WECHAT_APPID / WECHAT_APPSECRET
  或配合 --account NAME 使用 WECHAT_NAME_APPID / WECHAT_NAME_APPSECRET

  python3 bin/publish.py out/demo --cover cover.jpg          # 演练
  python3 bin/publish.py out/demo --cover cover.jpg --send   # 发到草稿箱
"""
import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from pathlib import Path

API = os.environ.get("WECHAT_API_BASE", "https://api.weixin.qq.com")
TAGS = ["svg", "animate", "animatetransform", "image", "text", "path", "rect", "circle", "line", "g"]


class WeChatError(RuntimeError):
    pass


def request_json(url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=60) as res:
            payload = json.loads(res.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise WeChatError(f"请求失败：{exc}") from exc
    if payload.get("errcode"):
        raise WeChatError(f"微信返回错误 {payload.get('errcode')}：{payload.get('errmsg')}")
    return payload


def post_json(path, token, body):
    url = f"{API}{path}?{urllib.parse.urlencode({'access_token': token})}"
    data = json.dumps(body, ensure_ascii=False).encode("utf-8")
    return request_json(url, data, {"Content-Type": "application/json"})


def get_token(appid, secret):
    # 用 stable_token：普通 token 接口每次调用都会让旧 token 失效，可能影响同账号的其他系统
    body = {"grant_type": "client_credential", "appid": appid, "secret": secret}
    data = json.dumps(body).encode("utf-8")
    return request_json(f"{API}/cgi-bin/stable_token", data, {"Content-Type": "application/json"})["access_token"]


def upload(path, token, file, **params):
    boundary = uuid.uuid4().hex
    head = (f'--{boundary}\r\nContent-Disposition: form-data; name="media"; filename="{file.name}"\r\n'
            "Content-Type: application/octet-stream\r\n\r\n").encode()
    data = head + file.read_bytes() + f"\r\n--{boundary}--\r\n".encode()
    query = urllib.parse.urlencode({"access_token": token, **params})
    return request_json(f"{API}{path}?{query}", data, {"Content-Type": f"multipart/form-data; boundary={boundary}"})


def count_tags(html):
    return {t: len(re.findall(rf"<{t}[\s>]", html, flags=re.I)) for t in TAGS}


def credentials(account):
    prefix = f"WECHAT_{account.upper()}_" if account else "WECHAT_"
    appid, secret = os.environ.get(f"{prefix}APPID"), os.environ.get(f"{prefix}APPSECRET")
    if not appid or not secret:
        raise WeChatError(f"缺少环境变量 {prefix}APPID 或 {prefix}APPSECRET")
    return appid, secret


def main():
    ap = argparse.ArgumentParser(description="把 build 产物推到公众号草稿箱，默认只演练")
    ap.add_argument("dir", type=Path)
    ap.add_argument("--account", help="账号别名，对应 WECHAT_别名_APPID 和 WECHAT_别名_APPSECRET")
    ap.add_argument("--cover", type=Path)
    ap.add_argument("--cover-media-id")
    ap.add_argument("--title")
    ap.add_argument("--author")
    ap.add_argument("--digest")
    ap.add_argument("--send", action="store_true", help="真的发送；不加就是演练")
    args = ap.parse_args()

    man = json.loads((args.dir / "manifest.json").read_text(encoding="utf-8"))
    html = (args.dir / "article.html").read_text(encoding="utf-8")
    title = args.title or man.get("title") or ""
    used = sorted(set(re.findall(r"asset:([\w.-]+)", html)))
    local = count_tags(html)

    print(f"标题：{title}")
    print(f"正文：{man['kb']}KB，{len(html)} 字符，{len(man['figs'])} 张图")
    print(f"待上传素材：{used}")
    print(f"本地标签数：{local}")
    if not args.send:
        print("演练结束，没有联网。确认后加 --send。")
        return 0
    if not (args.cover or args.cover_media_id):
        print("--send 必须指定 --cover 或 --cover-media-id", file=sys.stderr)
        return 2

    token = get_token(*credentials(args.account))

    # 同一账号的素材只传一次
    cache = args.dir / f"asset-urls.{args.account or 'default'}.json"
    urls = json.loads(cache.read_text()) if cache.exists() else {}
    for name in used:
        if name not in urls:
            urls[name] = upload("/cgi-bin/media/uploadimg", token, Path(man["assets"][name]))["url"]
            print(f"已上传 {name}")
    cache.write_text(json.dumps(urls, ensure_ascii=False, indent=2))
    content = re.sub(r"asset:([\w.-]+)", lambda m: urls[m.group(1)], html)

    thumb = args.cover_media_id or upload("/cgi-bin/material/add_material", token, args.cover, type="image")["media_id"]
    article = {
        "title": title,
        "author": args.author or man.get("author") or "",
        "digest": (args.digest or man.get("digest") or "")[:120],
        "content": content,
        "thumb_media_id": thumb,
    }
    media_id = post_json("/cgi-bin/draft/add", token, {"articles": [article]})["media_id"]
    print(f"草稿已创建：{media_id}")

    # 读回来核对：这一步回答「微信到底留下了什么」
    remote = count_tags(post_json("/cgi-bin/draft/get", token, {"media_id": media_id})["news_item"][0]["content"])
    print("标签存活核对（本地 → 草稿）：")
    same = True
    for tag in TAGS:
        changed = remote[tag] != local[tag]
        same = same and not changed
        print(f"  {tag}: {local[tag]} → {remote[tag]}{'  ← 有变化' if changed else ''}")
    print("全部保留，去手机预览确认动画在播。" if same else "有标签被改动，先别发布，手机预览后再判断。")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, WeChatError) as exc:
        print(f"出错：{exc}", file=sys.stderr)
        raise SystemExit(1)
