shader_type spatial;
render_mode diffuse_burley, specular_schlick_ggx;
varying vec3 world_pos;
varying vec3 world_normal;
float hash31(vec3 p) { p=fract(p*0.1031); p+=dot(p,p.yzx+33.33); return fract((p.x+p.y)*p.z); }
float noise3(vec3 p) {
 vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
 return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x),mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
 mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x),mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
void vertex() {
 world_pos=(MODEL_MATRIX*vec4(VERTEX,1.0)).xyz;
 world_normal=normalize(MODEL_NORMAL_MATRIX*NORMAL);
}
void fragment() {
 float slope=1.0-clamp(world_normal.y,0.0,1.0);
 float strata=sin(world_pos.y*2.6+noise3(world_pos*0.19)*2.4)*0.5+0.5;
 float broad=noise3(world_pos*0.075);
 float detail=noise3(world_pos*1.4);
 float grain=noise3(world_pos*9.0);
 vec3 sand=vec3(0.43,0.335,0.235);
 vec3 limestone=vec3(0.39,0.315,0.245);
 vec3 pale=vec3(0.61,0.51,0.385);
 vec3 rock=mix(limestone,pale,clamp(broad*0.65+strata*0.25,0.0,1.0));
 vec3 base=mix(sand,rock,smoothstep(0.10,0.43,slope));
 base*=0.78+0.34*broad+0.12*(detail-0.5)+0.08*(grain-0.5);
 ALBEDO=base;
 ROUGHNESS=0.96;
 SPECULAR=0.18;
}
