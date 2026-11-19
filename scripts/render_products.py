"""Finish TRELLIS.2 meshes with Fernvow label art and render their product images.

Run with Blender in background mode. The input GLBs come from generate_models.sh.
The script changes materials and UVs on the imported meshes and renders them.
"""

from array import array
from math import atan2, cos, radians, sin, tau
from pathlib import Path
import sys

import bpy
import numpy as np
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parent.parent
LABEL_DIR = ROOT / 'assets/models/textures'
STUDIO_HDR = ROOT / 'assets/models/studio-small-09.hdr'

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
    padding = array('f', [0.94, 0.93, 0.90, 1.0]) * (width * 256)
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
    shader.inputs['IOR'].default_value = 1.47
    surface_maps(material, shader, name)
    return material


def texture_node(material, name, rgb):
    height, width, _ = rgb.shape
    rgba = np.ones((height, width, 4), dtype=np.float32)
    rgba[:, :, :3] = rgb
    image = bpy.data.images.new(name, width, height, alpha=False)
    image.colorspace_settings.name = 'Non-Color'
    image.pixels.foreach_set(rgba.ravel())
    image.pack()
    node = material.node_tree.nodes.new('ShaderNodeTexImage')
    node.image = image
    node.extension = 'EXTEND'
    return node


def surface_maps(material, shader, name):
    # The UV strip reserves the middle two thirds for printed paper.
    width, height = 512, 384
    v = (np.arange(height, dtype=np.float32)[:, np.newaxis] + .5) / height
    paper = (v > 1 / 6) & (v < 5 / 6)
    plastic_roughness = np.where(v > 5 / 6, .27, .36)
    rng = np.random.default_rng(sum(map(ord, name)))
    noise = rng.random((height, width), dtype=np.float32) - .5
    material_roughness = np.where(paper, .65, plastic_roughness) + noise * np.where(paper, .11, .055)
    roughness = np.zeros((height, width, 3), dtype=np.float32)
    roughness[:, :, 0] = 1
    roughness[:, :, 1] = material_roughness

    # Tangent-space relief encodes the fine paper surface and label edge.
    relief = noise * np.where(paper, .23, .067) + paper * .16
    dy, dx = np.gradient(relief)
    normals = np.stack((-dx, -dy, np.ones_like(dx)), axis=2)
    normals = .5 + .5 * normals / np.linalg.norm(normals, axis=2, keepdims=True)

    nodes, links = material.node_tree.nodes, material.node_tree.links
    orm = texture_node(material, f'{name} paper and plastic roughness', roughness)
    separate = nodes.new('ShaderNodeSeparateColor')
    links.new(orm.outputs['Color'], separate.inputs[0])
    links.new(separate.outputs['Green'], shader.inputs['Roughness'])
    links.new(separate.outputs['Blue'], shader.inputs['Metallic'])

    normal_image = texture_node(material, f'{name} paper relief', normals)
    tangent = nodes.new('ShaderNodeNormalMap')
    tangent.inputs['Strength'].default_value = .58
    links.new(normal_image.outputs['Color'], tangent.inputs['Color'])
    links.new(tangent.outputs['Normal'], shader.inputs['Normal'])


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


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def build_stone_surface():
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.502))
    floor = bpy.context.object
    floor.name = 'Matte clay studio deck'
    material = bpy.data.materials.new('Clay with honed mineral grain')
    material.use_nodes = True
    floor.data.materials.append(material)
    nodes, links = material.node_tree.nodes, material.node_tree.links
    shader = next(node for node in nodes if node.type == 'BSDF_PRINCIPLED')
    shader.inputs['Roughness'].default_value = .59
    texture_coordinates = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = 28
    noise.inputs['Detail'].default_value = 3
    links.new(texture_coordinates.outputs['Object'], noise.inputs['Vector'])
    ramp = nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (.30, .135, .106, 1)
    ramp.color_ramp.elements[1].color = (.44, .237, .181, 1)
    links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
    links.new(ramp.outputs['Color'], shader.inputs['Base Color'])
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Distance'].default_value = .011
    bump.inputs['Strength'].default_value = .23
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], shader.inputs['Normal'])


def stage_render(scene, output, angle):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = 96
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.render.film_transparent = False
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGB'
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 1050
    scene.render.resolution_percentage = 100
    scene.world = bpy.data.worlds.new('Studio softboxes')
    scene.world.use_nodes = True
    background = next(node for node in scene.world.node_tree.nodes if node.type == 'BACKGROUND')
    environment = scene.world.node_tree.nodes.new('ShaderNodeTexEnvironment')
    environment.image = bpy.data.images.load(str(STUDIO_HDR), check_existing=True)
    scene.world.node_tree.links.new(environment.outputs['Color'], background.inputs[0])
    background.inputs[1].default_value = .23
    scene.view_settings.view_transform = 'AgX'
    build_stone_surface()

    camera_data = bpy.data.cameras.new('Studio 70 mm')
    camera_data.lens = 70
    camera = bpy.data.objects.new('Studio 70 mm', camera_data)
    scene.collection.objects.link(camera)
    theta = radians(angle)
    camera.location = (3.05 * sin(theta), -3.05 * cos(theta), .82)
    point_at(camera, (0, 0, -.02))
    scene.camera = camera

    lights = [
        ('Large window softbox', 350, 1.8, (1, .88, .79), 56, 2.35, 1.9),
        ('White fill card', 25, 2.0, (.93, .96, 1), -38, 1.8, .3),
        ('High strip light', 220, 1.35, (1, .78, .66), 153, 1.65, 1.3),
    ]
    for name, power, size, color, offset, distance, height in lights:
        light_data = bpy.data.lights.new(name, 'AREA')
        light_data.energy = power
        light_data.shape = 'RECTANGLE'
        light_data.size = size
        light_data.size_y = size * .64
        light_data.color = color
        light = bpy.data.objects.new(name, light_data)
        scene.collection.objects.link(light)
        theta = radians(angle + offset)
        light.location = (distance * sin(theta), -distance * cos(theta), height)
        point_at(light, (0, 0, -.04))

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
    stage_render(scene, destination / f'{slug}.png', 171)


if __name__ == '__main__':
    source, destination, *products = sys.argv[sys.argv.index('--') + 1:]
    source, destination = Path(source).resolve(), Path(destination).resolve()
    destination.mkdir(parents=True, exist_ok=True)
    for product in products or PRODUCTS:
        process_product(source, destination, product)
