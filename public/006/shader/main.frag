precision mediump float;

varying vec4 vColor;
varying vec3 vNormal;
varying mat4 vNormalMatrix;
varying vec3 vLight;

void main(){
  // 法線変換
  vec3 n = (vNormalMatrix * vec4(vNormal, 0.0)).xyz;

  // 法線とライトベクトルで内積
  float d = dot(normalize(n), normalize(vLight));

// 内積の結果
  gl_FragColor = vec4(vColor.rgb * d, vColor.a);
}

