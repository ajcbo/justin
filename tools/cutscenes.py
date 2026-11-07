"""Justin Clicker cutscenes, built and rendered with Blender (tested on 4.2, EEVEE Next).

Paper-cutout scenes using Justin's real photo (cut with the same outline the game uses), rendered to small,
silent H.264 MP4s so every device plays them with hardware video decoding. Text is overlaid by the game in HTML.

Run from the repository root:
  blender -b --factory-startup -P tools/cutscenes.py
Optional environment variables:
  ONLY=intro,rebirth      render a subset
  PREVIEW=40              render that single frame of each scene to PNG instead of video
  OUT_DIR=...             output folder (default assets/cutscenes)
"""
import bpy, bmesh, os, math, random
import numpy as np

ROOT = os.environ.get('JUSTIN_ROOT') or os.getcwd()
OUT = os.environ.get('OUT_DIR') or os.path.join(ROOT, 'assets', 'cutscenes')
TMP = os.environ.get('TMP_DIR') or os.path.join(ROOT, 'tools', '.cutscene-cache')
ONLY = set(filter(None, os.environ.get('ONLY', '').split(',')))
PREVIEW = os.environ.get('PREVIEW')
W, H, FPS = 640, 360, 24
os.makedirs(OUT, exist_ok=True)
os.makedirs(TMP, exist_ok=True)


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


# ---------- Justin's face, cut with the outline from classic.js ----------
FACE_PATH = [(168, 1190), (125, 1080, 130, 925, 202, 826), (281, 699, 408, 642, 536, 649), (677, 646, 838, 729, 902, 852),
             (946, 931, 921, 1083, 903, 1186), (970, 1176, 953, 1358, 903, 1371), (884, 1517, 844, 1726, 736, 1831),
             (670, 1892, 548, 1923, 467, 1868), (335, 1812, 278, 1643, 246, 1419), (176, 1440, 153, 1295, 168, 1190)]


def face_image():
    path = os.path.join(TMP, 'face_cut.png')
    if os.path.exists(path):
        return path
    src = bpy.data.images.load(os.path.join(ROOT, 'assets', 'friend.png'))
    w, h = src.size
    px = np.array(src.pixels[:], dtype=np.float32).reshape(h, w, 4)[::-1]
    pts, cur = [], FACE_PATH[0]
    for seg in FACE_PATH[1:]:
        p1, p2, p3 = seg[0:2], seg[2:4], seg[4:6]
        for i in range(1, 33):
            t = i / 32
            pts.append(tuple((1 - t) ** 3 * cur[k] + 3 * (1 - t) ** 2 * t * p1[k] + 3 * (1 - t) * t * t * p2[k] + t ** 3 * p3[k] for k in (0, 1)))
        cur = p3
    mask = np.zeros((h, w), np.float32)
    ys = [p[1] for p in pts]
    for y in range(int(min(ys)), int(max(ys)) + 1):
        yc, inter = y + .5, []
        for i in range(len(pts)):
            a, b = pts[i], pts[(i + 1) % len(pts)]
            if (a[1] <= yc < b[1]) or (b[1] <= yc < a[1]):
                inter.append(a[0] + (yc - a[1]) * (b[0] - a[0]) / (b[1] - a[1]))
        inter.sort()
        for k in range(0, len(inter) - 1, 2):
            mask[y, max(0, math.ceil(inter[k] - .5)):min(w, math.floor(inter[k + 1] - .5) + 1)] = 1
    x0, y0, cw, ch = 125, 635, 820, 1280
    out = px[y0:y0 + ch, x0:x0 + cw].copy()
    out[..., 3] = mask[y0:y0 + ch, x0:x0 + cw]
    out[..., :3] *= out[..., 3:4]
    out = out.reshape(ch // 2, 2, cw // 2, 2, 4).mean((1, 3))
    a = np.maximum(out[..., 3:4], 1e-6)
    out[..., :3] = np.where(out[..., 3:4] > 0, out[..., :3] / a, 0)
    img = bpy.data.images.new('face_cut', cw // 2, ch // 2, alpha=True)
    img.pixels = out[::-1].ravel()
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    return path


# ---------- scene + material helpers ----------
def new_scene(name, seconds, bg):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    r = sc.render
    r.engine = 'BLENDER_EEVEE_NEXT'
    r.resolution_x, r.resolution_y, r.resolution_percentage, r.fps = W, H, 100, FPS
    sc.frame_start, sc.frame_end = 1, int(seconds * FPS)
    sc.eevee.taa_render_samples = 16
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    world = bpy.data.worlds.new('world')
    sc.world = world
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs[0].default_value = (*srgb(bg), 1)
    cam = bpy.data.cameras.new('cam')
    cam.type, cam.ortho_scale = 'ORTHO', 16
    obj = bpy.data.objects.new('cam', cam)
    obj.location = (0, 0, 30)
    sc.collection.objects.link(obj)
    sc.camera = obj
    if PREVIEW:
        r.image_settings.file_format = 'PNG'
        r.filepath = os.path.join(TMP, name + '-preview.png')
    else:
        r.image_settings.file_format = 'FFMPEG'
        r.ffmpeg.format, r.ffmpeg.codec = 'MPEG4', 'H264'
        r.ffmpeg.constant_rate_factor, r.ffmpeg.ffmpeg_preset = 'MEDIUM', 'GOOD'
        r.ffmpeg.gopsize, r.ffmpeg.audio_codec = 12, 'NONE'
        r.filepath = os.path.join(OUT, name + '.mp4')
    random.seed(name)
    return sc, obj


def _mix_material(name, color_socket_fn, alpha):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    em = nt.nodes.new('ShaderNodeEmission')
    tr = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = alpha
    color_socket_fn(nt, em, mul)
    nt.links.new(mul.outputs[0], mix.inputs[0])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    m.surface_render_method = 'BLENDED'
    return m, mul.inputs[1]


def flat(hexc, alpha=1.0, name='flat'):
    def wire(nt, em, mul):
        em.inputs['Color'].default_value = (*srgb(hexc), 1)
        mul.inputs[0].default_value = 1
    return _mix_material(name, wire, alpha)


def picture(path, alpha=1.0, color=None, name='pic'):
    img = bpy.data.images.load(path, check_existing=True)
    img.alpha_mode = 'STRAIGHT'

    def wire(nt, em, mul):
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image, tex.interpolation = img, 'Linear'
        if color:
            em.inputs['Color'].default_value = (*srgb(color), 1)
        else:
            nt.links.new(tex.outputs['Color'], em.inputs['Color'])
        nt.links.new(tex.outputs['Alpha'], mul.inputs[0])
    return _mix_material(name, wire, alpha)


def link(obj, parent=None, loc=(0, 0, 0)):
    bpy.context.scene.collection.objects.link(obj)
    obj.parent = parent
    obj.location = loc
    return obj


def empty(name='group', parent=None, loc=(0, 0, 0)):
    return link(bpy.data.objects.new(name, None), parent, loc)


def mesh_from(points, mat, name='shape', parent=None, loc=(0, 0, 0), jitter=0.0, uv=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    vs = [bm.verts.new((x + random.uniform(-jitter, jitter), y + random.uniform(-jitter, jitter), 0)) for x, y in points]
    face = bm.faces.new(vs)
    if uv:
        layer = bm.loops.layers.uv.new()
        for loop, coord in zip(face.loops, uv):
            loop[layer].uv = coord
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    return link(bpy.data.objects.new(name, me), parent, loc)


def rect(w, h, mat, **kw):
    return mesh_from([(-w / 2, -h / 2), (w / 2, -h / 2), (w / 2, h / 2), (-w / 2, h / 2)], mat, uv=[(0, 0), (1, 0), (1, 1), (0, 1)], **kw)


def ellipse_pts(rx, ry, n=40, a0=0, a1=math.tau):
    return [(math.cos(a0 + (a1 - a0) * i / n) * rx, math.sin(a0 + (a1 - a0) * i / n) * ry) for i in range(n + (0 if a1 - a0 >= math.tau - 1e-6 else 1))]


def ring(r_out, r_in, mat, n=48, **kw):
    me = bpy.data.meshes.new('ring')
    bm = bmesh.new()
    outer = [bm.verts.new((math.cos(i / n * math.tau) * r_out, math.sin(i / n * math.tau) * r_out, 0)) for i in range(n)]
    inner = [bm.verts.new((math.cos(i / n * math.tau) * r_in, math.sin(i / n * math.tau) * r_in, 0)) for i in range(n)]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((outer[i], outer[j], inner[j], inner[i]))
    bm.to_mesh(me)
    bm.free()
    me.materials.append(mat)
    return link(bpy.data.objects.new('ring', me), kw.get('parent'), kw.get('loc', (0, 0, 0)))


def star_pts(r, inner=.42, points=4):
    return [(math.cos(i * math.pi / points + math.pi / 2) * (r if i % 2 == 0 else r * inner),
             math.sin(i * math.pi / points + math.pi / 2) * (r if i % 2 == 0 else r * inner)) for i in range(points * 2)]


def inked(points, color, parent=None, loc=(0, 0, 0), shadow=.12, jitter=.02, name='inked'):
    """A flat shape with a chunky offset ink shadow, like the game's buttons."""
    g = empty(name, parent, loc)
    mesh_from(points, flat('#202020', .9)[0], parent=g, loc=(shadow, -shadow, -.01), jitter=jitter)
    mesh_from(points, flat(color)[0], parent=g, loc=(0, 0, 0), jitter=jitter)
    return g


def sticker(height, parent=None, loc=(0, 0, 0), name='justin'):
    """Justin's real photo with a white paper border and a soft drop shadow."""
    path = face_image()
    g = empty(name, parent, loc)
    w = height * 410 / 640
    rect(w * 1.08, height * 1.055, picture(path, .25, '#000000')[0], parent=g, loc=(.13 * height / 5, -.16 * height / 5, -.02))
    rect(w * 1.08, height * 1.055, picture(path, 1, '#ffffff')[0], parent=g, loc=(0, 0, -.01))
    rect(w, height, picture(path)[0], parent=g, loc=(0, 0, 0))
    return g


# ---------- animation helpers ----------
def key(obj, f, loc=None, rot=None, scale=None, ip='BEZIER', ease='AUTO'):
    paths = []
    if loc is not None:
        obj.location = loc
        obj.keyframe_insert('location', frame=f)
        paths.append('location')
    if rot is not None:
        obj.rotation_euler = (0, 0, rot)
        obj.keyframe_insert('rotation_euler', frame=f)
        paths.append('rotation_euler')
    if scale is not None:
        obj.scale = scale if isinstance(scale, tuple) else (scale, scale, 1)
        obj.keyframe_insert('scale', frame=f)
        paths.append('scale')
    for fc in obj.animation_data.action.fcurves:
        if fc.data_path in paths:
            for kp in fc.keyframe_points:
                if abs(kp.co.x - f) < .01:
                    kp.interpolation, kp.easing = ip, ease


def fade(socket, f, value, ip='LINEAR'):
    socket.default_value = value
    socket.keyframe_insert('default_value', frame=f)


PALETTE = ['#ff5fb1', '#ffd400', '#5ec9ff', '#9dff3a', '#b47bff', '#ff8a3d']


def confetti(count, frames, origin, spread, up, gravity=-14, z=6, start=1, sway=0.0):
    pieces = []
    for i in range(count):
        mat = flat(PALETTE[i % len(PALETTE)])[0]
        w, h = random.uniform(.12, .22), random.uniform(.22, .38)
        p = rect(w, h, mat, loc=(origin[0], origin[1], z + i * .001))
        x, y = origin[0] + random.uniform(-spread[0], spread[0]), origin[1] + random.uniform(-spread[1], spread[1])
        vx, vy = random.uniform(-up[0], up[0]), random.uniform(up[1] * .6, up[1])
        rot, vr, delay = random.uniform(0, 6), random.uniform(-9, 9), random.randint(0, 8)
        key(p, 1, scale=0.0001, ip='CONSTANT')
        for f in range(start + delay, frames + 1, 3):
            t = (f - start - delay) / FPS
            key(p, f, loc=(x + vx * t + math.sin(t * 5 + i) * sway, y + vy * t + .5 * gravity * t * t, z + i * .001), rot=rot + vr * t, scale=1, ip='LINEAR')
        pieces.append(p)
    return pieces


def stars_field(count, color='#ffffff', z=-5, twinkle=True, frames=120):
    for i in range(count):
        s = mesh_from(star_pts(random.uniform(.05, .13), .45), flat(color, random.uniform(.5, .95))[0], loc=(random.uniform(-8, 8), random.uniform(-4.5, 4.5), z))
        if twinkle:
            phase = random.uniform(0, 6)
            for f in range(1, frames + 1, 8):
                key(s, f, scale=.6 + .5 * abs(math.sin(f / 9 + phase)), ip='LINEAR')


def render(sc):
    if PREVIEW:
        sc.frame_set(min(int(PREVIEW), sc.frame_end))
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)
    print('RENDERED', sc.render.filepath)


# ---------- scenes ----------
def intro():
    sc, cam = new_scene('intro', 6, '#ffffff')
    for i in range(-4, 5):
        rect(16.5, .025, flat('#dbe6f6')[0], loc=(0, i + .3, -8))
    rect(.03, 9.5, flat('#ffb3c1')[0], loc=(-6.4, 0, -7.9))
    j = sticker(6.2, loc=(0, -11, 0))
    key(j, 1, loc=(0, -11, 0), ip='CONSTANT')
    key(j, 24, loc=(0, -11, 0), ip='BACK', ease='EASE_OUT')
    key(j, 46, loc=(0, -.3, 0), rot=-.08)
    key(j, 54, rot=.05)
    key(j, 62, rot=0, scale=1)
    # The cursor arrives and clicks; Justin squashes and springs back.
    cur = empty('cursor', loc=(9, -7, 4))
    # Classic pointer as two convex pieces (head + tail): black outline layer, white fill layer.
    head, tail = [(0, 0), (0, -2.1), (1.5, -1.45)], [(.42, -1.5), (.86, -1.48), (1.3, -2.32), (.9, -2.5)]
    for pts, grow, color, z in ((head, .2, '#202020', 0), (tail, .16, '#202020', 0), (head, 0, '#ffffff', .02), (tail, 0, '#ffffff', .02)):
        cx, cy = sum(p[0] for p in pts) / len(pts), sum(p[1] for p in pts) / len(pts)
        k = 1 + grow
        mesh_from([(cx + (x - cx) * k, cy + (y - cy) * k) for x, y in pts], flat(color)[0], parent=cur, loc=(0, 0, z))
    mesh_from([(x + .12, y - .12) for x, y in head], flat('#000000', .2)[0], parent=cur, loc=(0, 0, -.02))
    key(cur, 1, loc=(9, -7, 4), ip='CONSTANT')
    key(cur, 66, loc=(9, -7, 4), ip='BEZIER', ease='EASE_OUT')
    key(cur, 90, loc=(1.6, -.1, 4), scale=1)
    key(cur, 95, scale=.82)
    key(cur, 100, scale=1)
    key(j, 95, scale=1)
    key(j, 99, scale=(1.14, .84, 1), ip='BEZIER')
    key(j, 105, scale=(.94, 1.07, 1))
    key(j, 112, scale=(1.02, .98, 1))
    key(j, 118, scale=1)
    for i in range(10):
        a = i / 10 * math.tau
        s = mesh_from(star_pts(.32), flat(PALETTE[i % 5])[0], loc=(1.4, 0, 3 + i * .01))
        key(s, 1, scale=.0001, ip='CONSTANT')
        key(s, 96, loc=(1.4, 0, 3), scale=.0001, ip='BEZIER', ease='EASE_OUT')
        key(s, 104, scale=1.1)
        key(s, 120, loc=(1.4 + math.cos(a) * 3.2, math.sin(a) * 2.6, 3), rot=a * 2, scale=.0001)
    confetti(46, 144, (0, -5), (4, .2), (5, 13), start=40)
    # Curtains open first.
    for side in (-1, 1):
        cg = empty('curtain', loc=(side * 4.1, 0, 8))
        rect(8.4, 9.6, flat('#e8344e')[0], parent=cg)
        for k in range(4):
            rect(.22, 9.6, flat('#b81f39', .55)[0], parent=cg, loc=(-3.2 + k * 2.1, 0, .01))
        key(cg, 1, loc=(side * 4.1, 0, 8), ip='CONSTANT')
        key(cg, 10, loc=(side * 4.1, 0, 8), ip='BEZIER', ease='EASE_IN_OUT')
        key(cg, 34, loc=(side * 12.6, 0, 8))
    val = empty('valance', loc=(0, 4.3, 8.5))
    rect(16.5, .7, flat('#b81f39')[0], parent=val)
    for k in range(17):
        mesh_from(ellipse_pts(.5, .3, 16, math.pi, math.tau), flat('#b81f39')[0], parent=val, loc=(-8 + k, -.35, 0))
    cam.data.ortho_scale = 16
    cam.data.keyframe_insert('ortho_scale', frame=110)
    cam.data.ortho_scale = 14.6
    cam.data.keyframe_insert('ortho_scale', frame=144)
    render(sc)


def rare():
    sc, cam = new_scene('rare', 3.5, '#fffbe6')
    rays = empty('rays', loc=(0, .4, -3))
    for i in range(14):
        a = i / 14 * math.tau
        mesh_from([(0, 0), (math.cos(a - .07) * 13, math.sin(a - .07) * 13), (math.cos(a + .07) * 13, math.sin(a + .07) * 13)], flat('#ffd400', .55)[0], parent=rays)
    key(rays, 1, scale=.0001, ip='CONSTANT')
    key(rays, 38, scale=.0001, rot=0, ip='BACK', ease='EASE_OUT')
    key(rays, 50, scale=1)
    key(rays, 84, rot=.7, ip='LINEAR')
    glow = mesh_from(ellipse_pts(2.6, 2.6), flat('#fff3a0', .9)[0], loc=(0, .4, -2))
    key(glow, 1, scale=.0001, ip='CONSTANT')
    key(glow, 38, scale=.0001, ip='BACK', ease='EASE_OUT')
    key(glow, 48, scale=1.3)
    key(glow, 84, scale=1.6)
    box = empty('box', loc=(0, -1.6, 0))
    inked([(-2, -1.6), (2, -1.6), (2, 1.6), (-2, 1.6)], '#dfff84', parent=box, shadow=.16)
    rect(.7, 3.2, flat('#ff5fb1')[0], parent=box, loc=(0, 0, .02))
    lid = empty('lid', parent=box, loc=(0, 2.05, .1))
    inked([(-2.3, -.5), (2.3, -.5), (2.3, .5), (-2.3, .5)], '#ff9fd4', parent=lid, shadow=.14)
    rect(.7, 1, flat('#ff5fb1')[0], parent=lid, loc=(0, 0, .02))
    for side in (-1, 1):
        inked(ellipse_pts(.75, .42, 24), '#ff5fb1', parent=lid, loc=(side * .62, .75, .03), shadow=.08)
    inked(ellipse_pts(.3, .3, 18), '#ff3d9a', parent=lid, loc=(0, .72, .05), shadow=.06)
    key(box, 1, rot=0, scale=1)
    for k, f in enumerate(range(6, 34, 3)):
        key(box, f, rot=(.035 + k * .008) * (1 if k % 2 else -1), ip='LINEAR')
    key(box, 34, rot=0, scale=1)
    key(box, 38, scale=(1.12, .86, 1))
    key(box, 44, scale=(.95, 1.06, 1))
    key(box, 50, scale=1)
    key(lid, 1, loc=(0, 2.05, .1), rot=0, ip='CONSTANT')
    key(lid, 38, loc=(0, 2.05, .1), rot=0, ip='BEZIER', ease='EASE_OUT')
    key(lid, 56, loc=(2.5, 9, .1), rot=-1.4)
    for i in range(16):
        a = i / 16 * math.tau + random.uniform(-.1, .1)
        s = mesh_from(star_pts(random.uniform(.25, .45)), flat(['#ffd400', '#ff5fb1', '#5ec9ff', '#ffffff'][i % 4])[0], loc=(0, .4, 1 + i * .01))
        key(s, 1, scale=.0001, ip='CONSTANT')
        key(s, 38, loc=(0, .4, 1), scale=.0001, ip='BEZIER', ease='EASE_OUT')
        key(s, 46, scale=1.2)
        key(s, 72, loc=(math.cos(a) * 7, math.sin(a) * 4.4 + .4, 1), rot=a * 3, scale=.0001)
    flash, alpha = flat('#fffdf2', 0, 'flash')
    rect(17, 10, flash, loc=(0, 0, 9))
    fade(alpha, 1, 0)
    fade(alpha, 68, 0)
    fade(alpha, 84, 1)
    render(sc)


def milestone():
    sc, cam = new_scene('milestone', 4, '#eef9ff')
    for side in (-1, 1):
        beam = empty('spot', loc=(side * 7.5, 5, -4))
        mesh_from([(0, 0), (-1.6 * side - 2.6, -11), (-1.6 * side + 2.6, -11)], flat('#fff3a0', .6)[0], parent=beam)
        for f in range(1, 97, 24):
            key(beam, f, rot=side * (.12 + .18 * math.sin(f / 13)), ip='BEZIER')
    for k in range(13):
        x = -7.5 + k * 1.25
        mesh_from([(-.5, 0), (.5, 0), (0, -.8)], flat(PALETTE[k % len(PALETTE)])[0], loc=(x, 4.35 - abs(math.sin(k / 12 * math.pi)) * .5, -1))
    rect(16.5, .04, flat('#202020', .6)[0], loc=(0, 4.35, -1.1))
    trophy = empty('trophy', loc=(0, -9, 0))
    head = sticker(4.6, parent=trophy, loc=(0, -.4, -.5))
    cup = [(-2.6, 1.6), (2.6, 1.6), (2.3, .2), (1.6, -.9), (.7, -1.4), (-.7, -1.4), (-1.6, -.9), (-2.3, .2)]
    inked(cup, '#ffd23a', parent=trophy, loc=(0, -1.2, .4), shadow=.16)
    rect(5.2, .35, flat('#fff2a8')[0], parent=trophy, loc=(0, .25, .45))
    for side in (-1, 1):
        r = ring(.9, .62, flat('#ffd23a')[0], parent=trophy, loc=(side * 2.55, -.7, .35))
    inked([(-.45, -2.6), (.45, -2.6), (.45, -3.6), (-.45, -3.6)], '#e8b100', parent=trophy, shadow=.1)
    inked([(-1.8, -3.6), (1.8, -3.6), (1.8, -4.3), (-1.8, -4.3)], '#c98f00', parent=trophy, shadow=.12)
    key(trophy, 1, loc=(0, -9, 0), ip='BACK', ease='EASE_OUT')
    key(trophy, 20, loc=(0, 0, 0))
    key(head, 1, loc=(0, -2.6, -.5), ip='CONSTANT')
    key(head, 22, loc=(0, -2.6, -.5), ip='BACK', ease='EASE_OUT')
    key(head, 38, loc=(0, 1.7, -.5), rot=0)
    for f, r in ((48, -.07), (60, .07), (72, -.05), (84, .05), (96, 0)):
        key(head, f, rot=r)
    confetti(70, 96, (0, 5.5), (8, .3), (1.5, -1), gravity=-5, start=24, sway=.6)
    render(sc)


def photo(path, tint=(1, 1, 1), name='photo'):
    """Justin's photo with controllable tint/desaturation, brightness, alpha and a reflection that travels across the face.
    Returns the material and its animatable sockets."""
    img = bpy.data.images.load(path, check_existing=True)
    img.alpha_mode = 'STRAIGHT'
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    N = nt.nodes.new
    tex = N('ShaderNodeTexImage')
    tex.image, tex.interpolation = img, 'Linear'
    bw = N('ShaderNodeRGBToBW')
    nt.links.new(tex.outputs['Color'], bw.inputs[0])
    tinted = N('ShaderNodeMixRGB')
    tinted.blend_type = 'MULTIPLY'
    tinted.inputs[0].default_value = 1
    nt.links.new(bw.outputs[0], tinted.inputs[1])
    tinted.inputs[2].default_value = (*tint, 1)
    material = N('ShaderNodeMixRGB')
    material.inputs[0].default_value = 1
    nt.links.new(tex.outputs['Color'], material.inputs[1])
    nt.links.new(tinted.outputs[0], material.inputs[2])
    coord = N('ShaderNodeTexCoord')
    mapping = N('ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value = (0, 0, .6)
    mapping.inputs['Location'].default_value = (-2, 0, 0)
    nt.links.new(coord.outputs['UV'], mapping.inputs['Vector'])
    grad = N('ShaderNodeTexGradient')
    nt.links.new(mapping.outputs['Vector'], grad.inputs['Vector'])
    ramp = N('ShaderNodeValToRGB')
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = .42, (0, 0, 0, 1)
    els[1].position, els[1].color = .58, (0, 0, 0, 1)
    mid = els.new(.5)
    mid.color = (1.4, 1.3, 1.1, 1)
    nt.links.new(grad.outputs['Fac'], ramp.inputs['Fac'])
    shine = N('ShaderNodeMixRGB')
    shine.blend_type = 'ADD'
    shine.inputs[0].default_value = 0
    nt.links.new(material.outputs[0], shine.inputs[1])
    nt.links.new(ramp.outputs['Color'], shine.inputs[2])
    em = N('ShaderNodeEmission')
    nt.links.new(shine.outputs[0], em.inputs['Color'])
    tr, mix, mul, out = N('ShaderNodeBsdfTransparent'), N('ShaderNodeMixShader'), N('ShaderNodeMath'), N('ShaderNodeOutputMaterial')
    mul.operation = 'MULTIPLY'
    mul.inputs[1].default_value = 1
    nt.links.new(tex.outputs['Alpha'], mul.inputs[0])
    nt.links.new(mul.outputs[0], mix.inputs[0])
    nt.links.new(tr.outputs[0], mix.inputs[1])
    nt.links.new(em.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], out.inputs[0])
    m.surface_render_method = 'BLENDED'
    return m, {'tint': material.inputs[0], 'strength': em.inputs['Strength'], 'glint': shine.inputs[0], 'sweep': mapping.inputs['Location'], 'alpha': mul.inputs[1]}


def face_card(height, tint, loc=(0, 0, 0), name='hero'):
    """A large sticker whose face material can be animated."""
    path = face_image()
    g = empty(name, None, loc)
    w = height * 410 / 640
    rect(w * 1.08, height * 1.055, picture(path, .3, '#000000')[0], parent=g, loc=(.16, -.2, -.02))
    border, border_alpha = picture(path, 1, '#ffffff')
    rect(w * 1.08, height * 1.055, border, parent=g, loc=(0, 0, -.01))
    mat, sockets = photo(path, tint, name + '-photo')
    rect(w, height, mat, parent=g)
    sockets['border'] = border_alpha
    return g, sockets


def sweep(sockets, f0, f1, strength=1.0):
    fade(sockets['glint'], 1, 0, 'CONSTANT')
    fade(sockets['glint'], f0, strength)
    fade(sockets['glint'], f1, strength)
    fade(sockets['glint'], f1 + 1, 0, 'CONSTANT')
    sockets['sweep'].default_value = (-1.6, 0, 0)
    sockets['sweep'].keyframe_insert('default_value', frame=f0)
    sockets['sweep'].default_value = (1.4, 0, 0)
    sockets['sweep'].keyframe_insert('default_value', frame=f1)


def sparkle_ring(count, radius, colors, start, z=2, ry=None):
    for i in range(count):
        a = i / count * math.tau + random.uniform(-.2, .2)
        s = mesh_from(star_pts(random.uniform(.22, .4)), flat(colors[i % len(colors)])[0], loc=(math.cos(a) * radius, math.sin(a) * (ry or radius), z + i * .01))
        f = start + (i % 5) * 4
        key(s, 1, scale=.0001, ip='CONSTANT')
        key(s, f, scale=.0001, ip='BACK', ease='EASE_OUT')
        key(s, f + 8, scale=1.1, rot=0)
        key(s, f + 26, scale=.0001, rot=1.6)


def world_color(sc, frames):
    node = sc.world.node_tree.nodes['Background'].inputs[0]
    for f, hexc in frames:
        node.default_value = (*srgb(hexc), 1)
        node.keyframe_insert('default_value', frame=f)


def camera_shake(cam, f0, frames=12, power=.18):
    key(cam, f0 - 1, loc=(0, 0, 30))
    for k in range(frames):
        p = power * (1 - k / frames)
        key(cam, f0 + k, loc=(random.uniform(-p, p), random.uniform(-p, p), 30), ip='LINEAR')
    key(cam, f0 + frames, loc=(0, 0, 30))


# ---------- first-time rare unlocks: one reveal per material ----------
def gold():
    """Darkness, a travelling golden reflection, then a heavy metallic reveal."""
    sc, cam = new_scene('gold', 5, '#000000')
    world_color(sc, ((1, '#000000'), (71, '#000000'), (76, '#3a2800'), (120, '#1c1300')))
    rays = empty('rays', loc=(0, 0, -3))
    for i in range(16):
        a = i / 16 * math.tau
        mesh_from([(0, 0), (math.cos(a - .06) * 13, math.sin(a - .06) * 13), (math.cos(a + .06) * 13, math.sin(a + .06) * 13)], flat('#ffcf3a', .35)[0], parent=rays)
    key(rays, 1, scale=.0001, ip='CONSTANT')
    key(rays, 72, scale=.0001, rot=0, ip='BACK', ease='EASE_OUT')
    key(rays, 82, scale=1)
    key(rays, 120, rot=.5, ip='LINEAR')
    hero, sock = face_card(6.4, (1.55, 1.08, .26), loc=(0, -.1, 0), name='gold')
    for f, v in ((1, .05), (20, .05), (26, .32), (70, .32), (72, 1.6), (84, 1.3)):
        fade(sock['strength'], f, v)
    for f, v in ((1, 0), (70, 0), (72, 1)):
        fade(sock['border'], f, v, 'CONSTANT' if f == 70 else 'LINEAR')
    sweep(sock, 24, 68, 1.0)
    sweep_late = sock['glint']
    fade(sweep_late, 92, 0)
    key(hero, 1, scale=1.12, ip='LINEAR')
    key(hero, 70, scale=1.0, ip='CONSTANT')
    key(hero, 72, scale=1.22, ip='BACK', ease='EASE_OUT')
    key(hero, 82, scale=1.0)
    camera_shake(cam, 72, 12, .22)
    sparkle_ring(14, 4.4, ['#ffd400', '#fff3a0', '#ffffff'], 76, ry=3.3)
    render(sc)


def platinum():
    """Two enormous metal shutters separate through cold mist."""
    sc, cam = new_scene('platinum', 5, '#cfd9e6')
    hero, sock = face_card(6.2, (1.05, 1.12, 1.25), loc=(0, -.1, 0), name='platinum')
    sweep(sock, 92, 114, .9)
    for i in range(10):
        blob = mesh_from(ellipse_pts(random.uniform(1.5, 3.2), random.uniform(.7, 1.3), 24), flat('#ffffff', random.uniform(.25, .45))[0], loc=(random.uniform(-9, 9), random.uniform(-4, 4), -1))
        x0 = blob.location.x
        key(blob, 1, loc=(x0, blob.location.y, -1), ip='LINEAR')
        key(blob, 120, loc=(x0 + random.choice((-1, 1)) * random.uniform(1.5, 3), blob.location.y + .4, -1))
    for side in (-1, 1):
        door = empty('shutter', loc=(side * 4.1, 0, 4))
        inked([(-4.15, -4.9), (4.15, -4.9), (4.15, 4.9), (-4.15, 4.9)], '#a9b3c3', parent=door, shadow=0, jitter=0)
        for k in range(9):
            rect(8.3, .14, flat('#8a94a6')[0], parent=door, loc=(0, -4.2 + k * 1.05, .02))
        for k in range(5):
            mesh_from(ellipse_pts(.13, .13, 10), flat('#6d778a')[0], parent=door, loc=(-side * 3.7, -3.6 + k * 1.8, .03))
        rect(.18, 9.8, flat('#2f3542')[0], parent=door, loc=(-side * 4.08, 0, .04))
        key(door, 1, loc=(side * 4.1, 0, 4), ip='LINEAR')
        for f in range(18, 34, 2):
            key(door, f, loc=(side * 4.1 + random.uniform(-.05, .05), random.uniform(-.03, .03), 4), ip='LINEAR')
        key(door, 36, loc=(side * 4.1, 0, 4), ip='BEZIER', ease='EASE_IN_OUT')
        key(door, 88, loc=(side * 12.8, 0, 4))
    for i in range(12):
        blob = mesh_from(ellipse_pts(random.uniform(1.6, 3.4), random.uniform(.7, 1.4), 24), flat('#f4f8ff', random.uniform(.35, .6))[0], loc=(random.uniform(-3, 3), random.uniform(-4.5, -1), 6 + i * .01))
        key(blob, 1, scale=.6, ip='LINEAR')
        key(blob, 40, loc=(blob.location.x * 1.2, blob.location.y, blob.location.z), scale=.8)
        key(blob, 110, loc=(blob.location.x * 3.5 + random.choice((-1, 1)) * 4, blob.location.y + random.uniform(.5, 2), blob.location.z), scale=1.6)
    camera_shake(cam, 36, 8, .08)
    sparkle_ring(12, 4.3, ['#ffffff', '#dfe8ff', '#b8c6ff'], 88, ry=3.4)
    render(sc)


def diamond():
    """A suspended crystal develops cracks, then breaks open around Justin."""
    sc, cam = new_scene('diamond', 5, '#0d1b2a')
    stars_field(30, '#9fe9ff', frames=120)
    rect(.04, 6, flat('#9fe9ff', .6)[0], loc=(0, 6.2, -.5))
    hero, sock = face_card(5.2, (.6, 1.15, 1.45), loc=(0, -.3, 0), name='diamond')
    for f, v in ((1, .35), (78, .35), (80, 1)):
        fade(sock['alpha'], f, v)
    for f, v in ((1, .6), (78, .6), (80, 1.3), (92, 1)):
        fade(sock['strength'], f, v)
    sweep(sock, 92, 112, .8)
    crystal = empty('crystal', loc=(0, -.3, 1))
    gem = [(-1.7, 3.6), (1.7, 3.6), (3.3, 1.6), (0, -4.2), (-3.3, 1.6)]
    mesh_from(gem, flat('#9ff3ff', .45)[0], parent=crystal, jitter=0)
    for a, b in (((-1.7, 3.6), (-1, 1.6)), ((1.7, 3.6), (1, 1.6)), ((-3.3, 1.6), (3.3, 1.6)), ((-1, 1.6), (0, -4.2)), ((1, 1.6), (0, -4.2))):
        mx, my, dx, dy = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, b[0] - a[0], b[1] - a[1]
        e = rect(math.hypot(dx, dy), .06, flat('#e9fdff', .8)[0], parent=crystal, loc=(mx, my, .02))
        e.rotation_euler = (0, 0, math.atan2(dy, dx))
    for f, r in ((1, -.04), (20, .04), (40, -.03), (60, .03), (79, 0)):
        key(crystal, f, rot=r)
    key(crystal, 79, scale=1, ip='CONSTANT')
    key(crystal, 80, scale=.0001, ip='CONSTANT')
    for i in range(9):
        a = i / 9 * math.tau + random.uniform(-.2, .2)
        length = random.uniform(1.4, 2.6)
        crack = rect(length, .07, flat('#ffffff')[0], parent=crystal, loc=(math.cos(a) * .3, math.sin(a) * .3 - .2, .05))
        crack.rotation_euler = (0, 0, a)
        crack.data.transform(__import__('mathutils').Matrix.Translation((length / 2, 0, 0)))
        crack.location = (math.cos(a) * .2, math.sin(a) * .2 - .2, .05)
        start = 40 + i * 4
        key(crack, 1, scale=(.0001, 1, 1), ip='CONSTANT')
        key(crack, start, scale=(.0001, 1, 1), ip='BEZIER', ease='EASE_OUT')
        key(crack, start + 8, scale=(1, 1, 1))
    for i in range(16):
        a = i / 16 * math.tau + random.uniform(-.15, .15)
        r0 = random.uniform(.5, 2.4)
        shard = mesh_from([(0, .5), (.35, -.35), (-.3, -.25)], flat(random.choice(['#9ff3ff', '#d8fbff', '#5ec9ff']), .8)[0], loc=(math.cos(a) * r0, math.sin(a) * r0 * 1.3 - .3, 2 + i * .01))
        key(shard, 1, scale=.0001, ip='CONSTANT')
        key(shard, 80, scale=random.uniform(1, 1.8), rot=0, ip='BEZIER', ease='EASE_OUT')
        key(shard, 104, loc=(math.cos(a) * (r0 + 7), math.sin(a) * (r0 + 5) - 2.5, 2 + i * .01), rot=random.uniform(-6, 6), scale=.0001)
    flash, alpha = flat('#e9fdff', 0, 'flash')
    rect(17, 10, flash, loc=(0, 0, 9))
    for f, v in ((1, 0), (78, 0), (80, .85), (90, 0)):
        fade(alpha, f, v)
    camera_shake(cam, 80, 10, .2)
    sparkle_ring(12, 4.2, ['#9ff3ff', '#ffffff', '#5ec9ff'], 86, ry=3.4)
    render(sc)


def rainbow():
    """Colours drain from the scene, gather into a ring, then sweep back outward from his face."""
    sc, cam = new_scene('rainbow', 5, '#808080')
    colors = ['#ff5fb1', '#ff8a3d', '#ffd400', '#9dff3a', '#5ec9ff', '#b47bff']
    stripes = []
    for i, c in enumerate(colors * 2):
        m, a = flat(c, .9)
        rect(1.45, 10, m, loc=(-8 + i * 1.45 + .7, 0, -3))
        node = m.node_tree.nodes['Emission'].inputs['Color']
        grey = sum(srgb(c)) / 3
        for f, col in ((1, (*srgb(c), 1)), (12, (*srgb(c), 1)), (40, (grey, grey, grey, 1)), (84 + abs(i - 5.5) * 1.2, (grey, grey, grey, 1)), (90 + abs(i - 5.5) * 1.2, (*srgb(c), 1))):
            node.default_value = col
            node.keyframe_insert('default_value', frame=int(f))
    hero, sock = face_card(6, (1, 1, 1), loc=(0, -.1, 0), name='rainbow')
    for f, v in ((1, 0), (12, 0), (40, 1), (82, 1), (88, 0)):
        fade(sock['tint'], f, v)
    sweep(sock, 92, 112, .8)
    ring_root = empty('ring', loc=(0, -.1, 1))
    for i, c in enumerate(colors):
        a0, a1 = i / 6 * math.tau, (i + 1) / 6 * math.tau
        pts = [(math.cos(a0 + (a1 - a0) * k / 10) * 4.1, math.sin(a0 + (a1 - a0) * k / 10) * 4.1) for k in range(11)] + [(math.cos(a1 - (a1 - a0) * k / 10) * 3.55, math.sin(a1 - (a1 - a0) * k / 10) * 3.55) for k in range(11)]
        seg = empty('seg', parent=ring_root)
        mesh_from(pts, flat(c)[0], parent=seg, jitter=0)
        mid = (a0 + a1) / 2
        key(seg, 1, loc=(math.cos(mid) * 14, math.sin(mid) * 10, 0), ip='CONSTANT')
        key(seg, 44 + i * 3, loc=(math.cos(mid) * 14, math.sin(mid) * 10, 0), ip='BEZIER', ease='EASE_OUT')
        key(seg, 66 + i * 2, loc=(0, 0, 0))
    key(ring_root, 1, scale=1, rot=0, ip='LINEAR')
    key(ring_root, 80, scale=.92, rot=-1.2, ip='BACK', ease='EASE_IN')
    key(ring_root, 84, scale=.85, ip='BEZIER', ease='EASE_OUT')
    key(ring_root, 96, scale=4.2, rot=-1.6)
    key(ring_root, 120, scale=5, rot=-1.8, ip='LINEAR')
    camera_shake(cam, 84, 10, .14)
    sparkle_ring(16, 4.3, colors, 88, ry=3.4)
    render(sc)


SCENES = {'intro': intro, 'rare': rare, 'milestone': milestone, 'gold': gold, 'platinum': platinum, 'diamond': diamond, 'rainbow': rainbow}
for name, build in SCENES.items():
    if not ONLY or name in ONLY:
        build()
