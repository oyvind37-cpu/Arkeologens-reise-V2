extends Node3D
## First playable-scale terrain blockout. 200 x 200 metres; procedural geometry, no external assets.
## Coordinates: X/Z horizontal, Y vertical. Not surveyed terrain.
const EXTENT := 200.0
const GRID := 220
const ROCK := Color(0.55, 0.43, 0.30)
var terrain: MeshInstance3D

func _ready() -> void:
	_build_terrain()
	_build_rock_scatter()
	# No artificial path markers in the landscape preview.
	# Tomb blockout disabled until a rock-cut entrance is modeled.
	_build_lighting()
	_build_camera()

func _height(x: float, z: float) -> float:
	var valley := maxf(0.0, absf(x) - 21.0)
	var cliff := pow(valley / 79.0, 1.13) * 51.0
	var strata_step := floor(cliff / 6.0) * 0.65 * smoothstep(24.0, 70.0, absf(x))
	var ridges := (sin(x * 0.11 + sin(z * 0.055) * 2.1) * sin(z * 0.075) * 5.0 + sin(x * 0.31 + z * 0.13) * 1.6)
	var erosion := (absf(sin(z * 0.045 + x * 0.09)) * -4.0 + sin(z * 0.021 + x * 0.013) * 3.0)
	var gullies := -pow(absf(sin(z * 0.115 + sin(x * 0.025) * 2.0)), 18.0) * 4.0 * smoothstep(25.0, 80.0, absf(x))
	var floor_noise := sin(x * 0.13) * cos(z * 0.09) * 0.32
	return cliff + strata_step + gullies + (ridges + erosion) * smoothstep(16.0, 60.0, absf(x)) + floor_noise

func _build_terrain() -> void:
	var vertices := PackedVector3Array()
	var uvs := PackedVector2Array()
	var indices := PackedInt32Array()
	for zi in range(GRID + 1):
		for xi in range(GRID + 1):
			var x := -EXTENT / 2.0 + EXTENT * float(xi) / GRID
			var z := -EXTENT / 2.0 + EXTENT * float(zi) / GRID
			vertices.append(Vector3(x, _height(x, z), z))
			uvs.append(Vector2(x, z) * 0.06)
	for zi in range(GRID):
		for xi in range(GRID):
			var a := zi * (GRID + 1) + xi
			var b := a + 1
			var c := a + GRID + 1
			var d := c + 1
			indices.append_array(PackedInt32Array([a, b, c, b, d, c]))
	var st := SurfaceTool.new()
	st.begin(Mesh.PRIMITIVE_TRIANGLES)
	for i in indices:
		st.set_uv(uvs[i])
		st.add_vertex(vertices[i])
	st.generate_normals()
	terrain = MeshInstance3D.new()
	terrain.name = "ValleyTerrain_200m"
	terrain.mesh = st.commit()
	var mat := load("res://limestone.gdshader") as Shader
	terrain.material_override = ShaderMaterial.new()
	terrain.material_override.shader = mat
	add_child(terrain)
	var body := StaticBody3D.new()
	body.name = "TerrainCollision"
	var shape := CollisionShape3D.new()
	shape.shape = terrain.mesh.create_trimesh_shape()
	body.add_child(shape)
	add_child(body)

func _build_rock_scatter() -> void:
	# Deterministic, lightweight talus scatter; deliberately sparse on the walkable valley floor.
	var rng := RandomNumberGenerator.new()
	rng.seed = 20261027
	var rock_mesh := SphereMesh.new()
	rock_mesh.radius = 1.0
	rock_mesh.height = 2.0
	rock_mesh.radial_segments = 7
	rock_mesh.rings = 4
	var rock_material := StandardMaterial3D.new()
	rock_material.albedo_color = Color(0.43, 0.35, 0.27)
	rock_material.roughness = 1.0
	rock_mesh.material = rock_material
	var scatter := MultiMesh.new()
	scatter.transform_format = MultiMesh.TRANSFORM_3D
	scatter.instance_count = 1000
	for i in range(scatter.instance_count):
		var x := rng.randf_range(-97.0, 97.0)
		var z := rng.randf_range(-97.0, 97.0)
		var slope_factor := smoothstep(15.0, 85.0, absf(x))
		# Shift most rubble toward the bases of the cliffs.
		if rng.randf() > slope_factor:
			x = (1.0 if x >= 0.0 else -1.0) * rng.randf_range(22.0, 65.0)
		var size := rng.randf_range(0.15, 0.9)
		if rng.randf() < 0.08:
			size *= 2.8
		var basis := Basis(Vector3.UP, rng.randf_range(0.0, TAU))
		basis = basis.scaled(Vector3(size * rng.randf_range(1.0, 1.8), size * rng.randf_range(0.35, 0.8), size * rng.randf_range(0.7, 1.5)))
		var pos := Vector3(x, _height(x, z) - size * 0.22, z)
		scatter.set_instance_transform(i, Transform3D(basis, pos))
	scatter.mesh = rock_mesh
	var instance := MultiMeshInstance3D.new()
	instance.name = "LimestoneTalus_1000"
	instance.multimesh = scatter
	add_child(instance)

func _build_path() -> void:
	# Sparse markers indicate the walkable valley route; replace with terrain-blended path.
	for i in range(11):
		var z := -85.0 + i * 17.0
		var marker := MeshInstance3D.new()
		marker.name = "PathStone_%02d" % i
		var mesh := BoxMesh.new()
		mesh.size = Vector3(1.2, 0.15, 0.7)
		marker.mesh = mesh
		marker.position = Vector3(5.0 + sin(z * 0.035) * 3.0, _height(5.0, z) + 0.03, z)
		var mat := StandardMaterial3D.new()
		mat.albedo_color = Color(0.42, 0.33, 0.23)
		marker.material_override = mat
		add_child(marker)

func _build_tomb() -> void:
	# Placeholder carved entrance on east-facing slope; NOT an archaeological reconstruction.
	var entrance := Node3D.new()
	entrance.name = "TombEntrance_BLOCKOUT"
	entrance.position = Vector3(45, _height(45, 48), 48)
	add_child(entrance)
	var stone_mat := StandardMaterial3D.new()
	stone_mat.albedo_color = Color(0.46, 0.36, 0.25)
	stone_mat.roughness = 1.0
	for spec in [
		[Vector3(-2.0, 1.7, 0), Vector3(1.0, 3.4, 1.2)],
		[Vector3(2.0, 1.7, 0), Vector3(1.0, 3.4, 1.2)],
		[Vector3(0, 3.5, 0), Vector3(5.0, 0.8, 1.2)]
	]:
		var block := MeshInstance3D.new()
		block.mesh = BoxMesh.new()
		block.mesh.size = spec[1]
		block.position = spec[0]
		block.material_override = stone_mat
		entrance.add_child(block)
	var shadow := MeshInstance3D.new()
	shadow.name = "DarkEntrancePlaceholder"
	var plane := PlaneMesh.new()
	plane.size = Vector2(3.0, 3.0)
	shadow.mesh = plane
	shadow.rotation_degrees.x = 90
	shadow.position = Vector3(0, 1.5, -0.15)
	var dark := StandardMaterial3D.new()
	dark.albedo_color = Color(0.018, 0.014, 0.01)
	dark.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	dark.cull_mode = BaseMaterial3D.CULL_DISABLED
	shadow.material_override = dark
	entrance.add_child(shadow)

func _build_lighting() -> void:
	var world := WorldEnvironment.new()
	world.name = "EgyptAtmosphere"
	var env := Environment.new()
	env.background_mode = Environment.BG_COLOR
	env.background_color = Color(0.36, 0.53, 0.69)
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.ambient_light_color = Color(0.66, 0.73, 0.83)
	env.ambient_light_energy = 0.25
	env.tonemap_mode = Environment.TONE_MAPPER_FILMIC
	world.environment = env
	add_child(world)
	var sun := DirectionalLight3D.new()
	sun.name = "LateAfternoonSun"
	sun.rotation_degrees = Vector3(-38, -30, 0)
	sun.light_energy = 1.15
	sun.shadow_enabled = true
	add_child(sun)

func _build_camera() -> void:
	var camera := Camera3D.new()
	camera.name = "OverviewCamera"
	camera.position = Vector3(0, 2.5, 82)
	camera.rotation_degrees = Vector3(-5, 0, 0)
	camera.fov = 72
	camera.current = true
	add_child(camera)
