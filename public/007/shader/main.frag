precision mediump float;

uniform sampler2D textureUnit0; // テクスチャ @@@
uniform sampler2D textureUnit1; // テクスチャ @@@
uniform float ratio;

varying vec4 vColor;
varying vec2 vTexCoord; // テクスチャ座標 @@@

void main(){
  // テクスチャから、テクスチャ座標の位置の色をピックする @@@
  vec4 textureColor0 = texture2D(textureUnit0, vTexCoord);
  vec4 textureColor1 = texture2D(textureUnit1, vTexCoord);

  gl_FragColor = vColor * ((1.0 - ratio) * textureColor0 + ratio * textureColor1);
}

