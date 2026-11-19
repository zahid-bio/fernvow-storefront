"""Finish TRELLIS.2 meshes with Fernvow label art and render their product images.

Run with Blender in background mode. The input GLBs come from generate_models.sh.
The script changes materials and UVs on the imported meshes and renders them.
"""

from array import array
from math import atan2, cos, radians, sin, tau
from pathlib import Path
import sys

import bpy
from mathutils import Matrix


ROOT = Path(__file__).resolve().parent.parent
LABEL_DIR = ROOT / 'assets/models/textures'

# Bounds are in TRELLIS.2's normalized Blender coordinate space.
PRODUCTS = {
    'foam': ('daily-cleansing-foam', ('foam',), -0.42, 0.14),
    'moisturizer': ('daily-face-moisturizer', ('moisturizer',), -0.42, 0.20),
    'toner': ('hydrating-toner', ('toner',), -0.43, 0.22),
    'duo': ('the-daily-duo', ('foam', 'moisturizer'), -0.42, 0.15),
}


def make_label_material(name):
    art = bpy.data.images.load(str(LABEL_DIR / f'label-{name}.png'), check_existing=True)
    width, height = art.size
    sheet = bpy.data.images.new(f'Fernvow {name} wrap', width, height + 512, alpha=False)
    padding = array('f', [0.97, 0.96, 0.93, 1.0]) * (width * 256)
    art_pixels = array('f', [0.0]) * (width * height * 4)
    art.pixels.foreach_get(art_pixels)
    sheet.pixels.foreach_set(padding + art_pixels + padding)
    sheet.pack()

    material = bpy.data.materials.new(f'Fernvow {name}')
    material.use_nodes = True
    shader = next(node for node in material.node_tree.nodes if node.type == 'BSDF_PRINCIPLED')
    shader.inputs['Roughness'].default_value = 0.43
    shader.inputs['Metallic'].default_value = 0
    texture = material.node_tree.nodes.new('ShaderNodeTexImage')
    texture.image = sheet
    texture.extension = 'EXTEND'
    material.node_tree.links.new(texture.outputs['Color'], shader.inputs['Base Color'])
    return material


def apply_wrap(mesh_object, wraps, label_bottom, label_top, centers):
    mesh = mesh_object.data
    mesh.materials.clear()
    for wrap in wraps:
        mesh.materials.append(make_label_material(wrap))
    for old_uv in list(mesh.uv_layers):
        mesh.uv_layers.remove(old_uv)
    uv_layer = mesh.uv_layers.new(name='Bottle wrap')

    world = mesh_object.matrix_world
    positions = [world @ vertex.co for vertex in mesh.vertices]
    coordinates = array('f', [0.0]) * (len(mesh.loops) * 2)
    for face in mesh.polygons:
        part = min(range(len(centers)), key=lambda index: abs((world @ face.center).x - centers[index][0]))
        face.material_index = part
        center_x, center_y = centers[part][:2]
        bottom, top = centers[part][2:] or (label_bottom, label_top)
        lo, hi = bottom - (top - bottom) * .25, top + (top - bottom) * .25
        face_indices = range(face.loop_start, face.loop_start + face.loop_total)
        face_uv = []
        for index in face_indices:
            point = positions[mesh.loops[index].vertex_index]
            u = .5 + atan2(center_x - point.x, point.y - center_y) / tau
            v = min(1, max(0, (point.z - lo) / (hi - lo)))
            face_uv.append((u, v))
        crosses_seam = max(u for u, _ in face_uv) - min(u for u, _ in face_uv) > .5
        for index, (u, v) in zip(face_indices, face_uv):
            if crosses_seam:
                u = 0 if u < .5 else 1
            coordinates[index * 2:index * 2 + 2] = array('f', [u, v])
    uv_layer.uv.foreach_set('vector', coordinates)


def point_at(obj):
    obj.rotation_euler = (-obj.location).to_track_quat('-Z', 'Y').to_euler()


def stage_render(scene, output, angle, scale=1.24):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 36
    scene.cycles.use_denoising = True
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.resolution_x = 850
    scene.render.resolution_y = 950
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new('Ambient fill')
    scene.world.use_nodes = True
    background = next(node for node in scene.world.node_tree.nodes if node.type == 'BACKGROUND')
    background.inputs[0].default_value = (.77, .72, .67, 1)
    background.inputs[1].default_value = .48
    scene.view_settings.view_transform = 'AgX'

    camera_data = bpy.data.cameras.new('Product camera')
    camera_data.type = 'ORTHO'
    camera_data.ortho_scale = scale
    camera = bpy.data.objects.new('Product camera', camera_data)
    scene.collection.objects.link(camera)
    theta = radians(angle)
    camera.location = (2.9 * sin(theta), -2.9 * cos(theta), .24)
    point_at(camera)
    scene.camera = camera

    lights = [
        ('Key', 185, 2.1, (1, .91, .82), 53, 2.2, 1.6),
        ('Fill', 72, 2.2, (.88, .94, 1), -47, 1.65, .4),
        ('Rim', 145, 1.6, (1, .86, .76), 170, 1.65, 1.15),
    ]
    for name, power, size, color, offset, distance, height in lights:
        light_data = bpy.data.lights.new(name, 'AREA')
        light_data.energy = power
        light_data.size = size
        light_data.color = color
        light = bpy.data.objects.new(name, light_data)
        scene.collection.objects.link(light)
        theta = radians(angle + offset)
        light.location = (distance * sin(theta), -distance * cos(theta), height)
        point_at(light)

    scene.render.filepath = str(output)
    bpy.ops.render.render(write_still=True)


def process_product(source, destination, product):
    slug, wraps, bottom, top = PRODUCTS[product]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(source / f'{product}.glb'))
    scene = bpy.context.scene
    mesh_object, = (obj for obj in scene.objects if obj.type == 'MESH')
    mesh_object.name = slug
    mesh_object['geometry_source'] = 'Microsoft TRELLIS.2 Q4 GGUF via trellis.cpp v0.8.1'

    centers = [(0, 0)]
    if product == 'duo':
        mesh_object.matrix_world = Matrix.Rotation(radians(-90), 4, 'Z') @ mesh_object.matrix_world
        bpy.context.view_layer.update()
        centers = [(0.142, 0, -.43, .12), (-.192, 0, -.43, -.04)]
    apply_wrap(mesh_object, wraps, bottom, top, centers)
    bpy.ops.export_scene.gltf(filepath=str(destination / f'{slug}.glb'), export_format='GLB', export_extras=True)
    stage_render(scene, destination / f'{slug}.png', 172)
    if product == 'foam':
        stage_render(scene, destination / 'hero-cleanser.png', 164, scale=1.12)


if __name__ == '__main__':
    source, destination, *products = sys.argv[sys.argv.index('--') + 1:]
    source, destination = Path(source).resolve(), Path(destination).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    for product in products or PRODUCTS:
        process_product(source, destination, product)
