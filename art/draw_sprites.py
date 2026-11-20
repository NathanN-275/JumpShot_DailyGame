"""Build Jumpshot's original pixel art with Python's standard library."""

import struct
import zlib
from pathlib import Path


DIST = Path(__file__).resolve().parent.parent / "dist"
INK = "#211b29"
WHITE = "#fdeedb"
INK_BLUE = "#151c2c"


class SpriteSheet:
    def __init__(self, width, height):
        self.width, self.height = width, height
        self.rows = [bytearray(width * 4) for _ in range(height)]

    def rect(self, x, y, width, height, color):
        pixel = bytes.fromhex(color.removeprefix("#")) + b"\xff"
        for row in range(max(0, y), min(y + height, self.height)):
            start = max(0, x)
            end = min(x + width, self.width)
            self.rows[row][start * 4 : end * 4] = pixel * (end - start)

    def sprite(self, x, y, drawing, colors):
        for dy, row in enumerate(drawing.split()):
            for dx, symbol in enumerate(row):
                if symbol != ".":
                    self.rect(x + dx, y + dy, 1, 1, colors[symbol])

    def save(self, filename):
        def chunk(kind, data):
            return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

        header = struct.pack(">IIBBBBB", self.width, self.height, 8, 6, 0, 0, 0)
        pixels = b"".join(b"\0" + row for row in self.rows)
        (DIST / filename).write_bytes(
            b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(pixels, 9)) + chunk(b"IEND", b"")
        )


HEAD = """
...ooooooo......
..ohHHHHHho.....
.ohHHHHHHhho....
.oHHHHHHhhsso...
.oHHHHHhssssso..
.ohHHHhsslssoo..
.ohhhssslleoso..
..osdsslsseosso.
..osdssllsssso..
...odssllssoo...
....odssdddo....
.....odsssoo....
......oooo......
"""

JERSEY = """
....ooossoo.....
...ottsstttoo...
..otttjjjttooo..
..ojjjwwjJjoo...
..ojjjwwjjjoo...
...ojjjjjjJoo...
...ojjtjjJJoo...
...ojjtjjJJoo...
...ootttttooo...
....oooooooo....
"""

OFFICIAL = """
....ooossoo.....
...owOwOwOooo...
..oowOwOwOwOoo..
..oOwOwOwOwOo...
..oOwOwOwOwOo...
...owOwOwOWoo...
...owOwOwOWoo...
...owOwOwOWoo...
...oooooooooo...
....oooooooo....
"""

ARM = """
....oooo........
...oslsso.......
...oslsso.......
...oslssoo......
...odsssso......
....odsssoo.....
.....odwwsso....
......oossoo....
........oo......
"""

SHORTS = """
..oooooooooooo..
..otjjJJjjtJJo..
..ojjJJJJjtJJo..
..ojjJoooooJJo..
..oddo...ossdo..
..ossdo..ossdo..
...osdo...ossdo.
...otwo...owwwo.
..oWwwo...oWwwo.
.oWWwoo...oWWwoo
.ooooo....ooooo.
"""

SKINS = [
    ("#a56640", "#d59a5c", "#693842", "#292233", "#463247"),
    ("#d69b72", "#f7c599", "#9e635a", "#634136", "#8d5642"),
    ("#734632", "#a76a44", "#512c33", "#221e2b", "#3f3141"),
    ("#b77451", "#e1a278", "#814b4c", "#352527", "#684039"),
    ("#95583e", "#c98d58", "#6d3740", "#34313e", "#4f4150"),
]


def outfit(skin_index, kit):
    skin, light, shadow, hair, hair_light = SKINS[skin_index]
    jersey, dark, trim = kit
    return dict(o=INK, O="#292734", s=skin, l=light, d=shadow, h=hair, H=hair_light,
                j=jersey, J=dark, t=trim, w=WHITE, W="#c4c3dc", e="#fff4d9")


def draw_athletes():
    sheet = SpriteSheet(80, 176)
    kits = [("#2861cf", "#1d3588", "#8bd8ff"), ("#bc364e", "#692743", "#ff9a84")]
    for row in range(11):
        referee = row == 10
        colors = outfit(row % 5, ("#4c485c", "#292734", "#737083") if referee else kits[row // 5])
        head_colors = colors | {"h": "#875643", "H": "#bb8d67", "s": "#dca17b", "l": "#ffd9ac"} if referee else colors
        y = row * 16
        sheet.sprite(0, y, HEAD, head_colors)
        sheet.sprite(16, y, OFFICIAL if referee else JERSEY, colors)
        sheet.sprite(32, y, ARM, colors)
        sheet.sprite(48, y, ARM, colors | {"s": colors["d"], "l": colors["s"]})
        sheet.sprite(64, y, SHORTS, colors)
    sheet.save("athletes.png")


def draw_crowd():
    sheet = SpriteSheet(144, 96)
    shirts = ["#495e92", "#754852", "#54907a", "#bf8c50", "#66568b", "#518396", "#706753", "#964a4f", "#6e4679"]
    for frame in range(3):
        layer_top = frame * 32
        sheet.rect(0, layer_top, 144, 32, "#202132")
        for rail in (12, 27):
            sheet.rect(0, layer_top + rail, 144, 1, "#484353")
            sheet.rect(0, layer_top + rail + 1, 144, 1, "#292638")
        for row in range(2):
            for index, shirt in enumerate(shirts):
                x = 2 + 15 * index + 6 * row
                y = layer_top + 4 + 14 * row + index % 3
                skin, light, shadow, hair, _ = SKINS[(index + 2 * row) % len(SKINS)]
                cheer = frame and (index + row + frame) % 3 != 0
                y -= 2 if cheer else 0
                sheet.rect(x - 1, y + 6, 13, 7, "#32384c")
                if cheer:
                    sheet.rect(x - 2, y - 1, 3, 8, INK_BLUE)
                    sheet.rect(x + 10, y - 2, 3, 8, INK_BLUE)
                    sheet.rect(x - 1, y - 1, 1, 5, light)
                    sheet.rect(x + 11, y - 2, 1, 5, light)
                sheet.rect(x + 1, y + 5, 10, 6, INK)
                sheet.rect(x + 2, y + 6, 8, 4, shirt)
                sheet.rect(x + 5, y + 6, 2, 1, WHITE)
                sheet.rect(x + 3, y, 6, 6, INK)
                sheet.rect(x + 4, y + 1, 4, 4, skin)
                sheet.rect(x + 3, y, 6, 2, hair)
                sheet.rect(x + 7, y + 2, 1, 1, light)
                sheet.rect(x + 4, y + 4, 1, 1, shadow)
    sheet.save("crowd.png")


if __name__ == "__main__":
    draw_athletes()
    draw_crowd()
