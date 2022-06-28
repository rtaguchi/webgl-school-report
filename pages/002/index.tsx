import { useEffect, useRef } from "react";
import type { NextPage } from "next";

// 必要なモジュールを読み込み
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * three.js を効率よく扱うために自家製の制御クラスを定義
 */
class App3 {
  renderer: any; // レンダラ
  scene: any; // シーン
  camera: any; // カメラ
  spotLight: any;
  spotLight2: any;
  directionalLight: any; // ディレクショナルライト
  ambientLight: any; // アンビエントライト
  geometry: any; //ジオメトリ
  geometry2: any; //ジオメトリ
  material: any; // マテリアル
  boxArray: any; // ボックスメッシュ
  controls: any; // オービットコントロール
  axesHelper: any; // 軸ヘルパー
  isDown: any; // キーの押下状態を保持するフラグ
  lightAngle: any;
  lightAngle2: any;
  headGroup: any;
  poleHead: any;
  poleHeadRotate: boolean;
  fan: any;

  /*
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      // fovy は Field of View Y のことで、縦方向の視野角を意味する
      fovy: 60,
      // 描画する空間のアスペクト比（縦横比）
      aspect: window.innerWidth / window.innerHeight,
      // 描画する空間のニアクリップ面（最近面）
      near: 0.1,
      // 描画する空間のファークリップ面（最遠面）
      far: 20.0,
      // カメラの位置
      x: 5.0,
      y: 3.0,
      z: 5.0,
      // カメラの中止点
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      // レンダラーが背景をリセットする際に使われる背景色
      clearColor: 0x001d42,
      // レンダラーが描画する領域の横幅
      width: window.innerWidth,
      // レンダラーが描画する領域の縦幅
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 1.0, // 光の強度
      x: 1.0, // 光の向きを表すベクトルの X 要素
      y: 1.0, // 光の向きを表すベクトルの Y 要素
      z: 1.0, // 光の向きを表すベクトルの Z 要素
    };
  }
  /**
   * スポットライト定義のための定数
   */
  static get SPOT_LIGHT_PARAM() {
    return {
      color: 0x0000ff, // 光の色
      color2: 0xff0000, // 光の色
      intensity: 2, // 光の強度
      distance: 50,
      decay: 2,
      x: 40.0,
      y: 0.0,
      z: 0.0,
    };
  }

  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff, // 光の色
      intensity: 0.1, // 光の強度
    };
  }
  /**
   * マテリアル定義のための定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0x98a3d2, // マテリアルの基本色
      side: THREE.DoubleSide,
    };
  }

  /**
   * フォグの定義のための定数 @@@
   */
  static get FOG_PARAM() {
    return {
      fogColor: 0x001d42, // フォグの色
      fogNear: 1.0, // フォグの掛かり始めるカメラからの距離
      fogFar: 20.0, // フォグが完全に掛かるカメラからの距離
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.isDown = false; // キーの押下状態を保持するフラグ
    this.poleHeadRotate = true;

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);
  }

  /**
   * 初期化処理
   */
  init() {
    // レンダラー
    const canvas = document.querySelector("#webgl");
    if (!canvas) return;

    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.renderer.setClearColor(
      new THREE.Color(App3.RENDERER_PARAM.clearColor)
    );
    this.renderer.setSize(
      App3.RENDERER_PARAM.width,
      App3.RENDERER_PARAM.height
    );

    // シーン
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(
      App3.FOG_PARAM.fogColor,
      App3.FOG_PARAM.fogNear,
      App3.FOG_PARAM.fogFar
    );

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      App3.CAMERA_PARAM.fovy,
      App3.CAMERA_PARAM.aspect,
      App3.CAMERA_PARAM.near,
      App3.CAMERA_PARAM.far
    );
    this.camera.position.set(
      App3.CAMERA_PARAM.x,
      App3.CAMERA_PARAM.y,
      App3.CAMERA_PARAM.z
    );
    this.camera.lookAt(App3.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      App3.DIRECTIONAL_LIGHT_PARAM.color,
      App3.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.set(
      App3.DIRECTIONAL_LIGHT_PARAM.x,
      App3.DIRECTIONAL_LIGHT_PARAM.y,
      App3.DIRECTIONAL_LIGHT_PARAM.z
    );
    this.scene.add(this.directionalLight);

    // スポットライト
    this.spotLight = new THREE.SpotLight(
      App3.SPOT_LIGHT_PARAM.color,
      App3.SPOT_LIGHT_PARAM.intensity,
      App3.SPOT_LIGHT_PARAM.distance
    );
    this.spotLight.position.set(
      App3.SPOT_LIGHT_PARAM.x,
      App3.SPOT_LIGHT_PARAM.y,
      App3.SPOT_LIGHT_PARAM.z
    );
    this.scene.add(this.spotLight);

    // スポットライト
    this.spotLight2 = new THREE.SpotLight(
      App3.SPOT_LIGHT_PARAM.color2,
      App3.SPOT_LIGHT_PARAM.intensity,
      App3.SPOT_LIGHT_PARAM.distance
    );
    this.spotLight2.position.set(
      App3.SPOT_LIGHT_PARAM.x,
      App3.SPOT_LIGHT_PARAM.y,
      App3.SPOT_LIGHT_PARAM.z
    );
    this.scene.add(this.spotLight2);

    // アンビエントライト（環境光） @@@
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);
    this.lightAngle = 0;
    this.lightAngle2 = Math.PI;

    // ジオメトリ
    this.geometry = new THREE.CircleGeometry(1.0, 32, 0.0, 0.9);
    this.geometry2 = new THREE.CylinderGeometry(0.2, 0.2, 0.2, 22, 22);

    // マテリアル @@@
    // - 反射光を表現できるマテリアル -----------------------------------------
    // MeshLambertMaterial は拡散光を表現できますが、MeshPhongMaterial を利用す
    // ると拡散光に加えて反射光を表現することができます。
    // 反射光の外見上の特徴としては、拡散光よりもより強いハイライトが入ります。
    // また、視点（カメラ）の位置によって見え方に変化が表れるのも拡散光には見ら
    // れない反射光ならではの現象です。
    // --------------------------------------------------------------------
    this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);

    this.headGroup = new THREE.Group();
    this.scene.add(this.headGroup);
    this.poleHead = new THREE.Group();
    this.scene.add(this.poleHead);
    this.fan = new THREE.Group();
    this.scene.add(this.fan);

    // メッシュ
    const fixArray = [];
    const FIN_NUM = 5;
    for (let i = 0; i < FIN_NUM; i++) {
      const fin = new THREE.Mesh(this.geometry, this.material);
      fin.rotation.z = ((2 * Math.PI) / FIN_NUM) * i;
      // fin.rotation.x = -0.3;
      // fin.rotation.y = 0.05;

      this.headGroup.add(fin);
      fixArray.push(fin);
    }
    const cylinder = new THREE.Mesh(this.geometry2, this.material);
    cylinder.rotation.x = Math.PI / 2;
    this.headGroup.add(cylinder);
    const cylinder2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.2, 22, 22),
      this.material
    );
    cylinder2.position.z = -0.2;
    cylinder2.rotation.x = Math.PI / 2;
    this.headGroup.add(cylinder2);

    // 初期配置
    this.headGroup.position.y = 2.0;
    this.headGroup.position.z = 0.3;

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.2, 22, 22),
      this.material
    );
    pole.position.y = 1.1;
    this.poleHead.add(this.headGroup);
    this.poleHead.add(pole);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.0, 1.0, 0.1, 22, 22),
      this.material
    );
    base.position.x = 0.05;
    this.fan.add(this.poleHead);
    this.fan.add(base);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.scene.add(this.axesHelper);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    this.headGroup.rotation.z -= 0.08;

    if (this.poleHead.rotation.y > Math.PI / 2) {
      this.poleHeadRotate = false;
    }
    if (this.poleHead.rotation.y < 0) {
      this.poleHeadRotate = true;
    }

    if (this.poleHeadRotate) {
      this.poleHead.rotation.y += 0.005;
    } else {
      this.poleHead.rotation.y -= 0.005;
    }

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }

  console(text: string | number) {
    console.log(text);
  }
}

const Page002: NextPage = () => {
  // 制御クラスのインスタンスを生成
  const appRef = useRef(new App3());
  const countRef = useRef(0);

  useEffect(() => {
    // キーの押下や離す操作を検出できるようにする
    window.addEventListener(
      "keydown",
      (keyEvent) => {
        switch (keyEvent.key) {
          case " ":
            appRef.current.isDown = true;
            break;
          default:
        }
      },
      false
    );
    window.addEventListener(
      "keyup",
      (keyEvent) => {
        appRef.current.isDown = false;
      },
      false
    );

    // リサイズイベント
    window.addEventListener(
      "resize",
      () => {
        appRef.current.renderer.setSize(window.innerWidth, window.innerHeight);
        appRef.current.camera.aspect = window.innerWidth / window.innerHeight;
        appRef.current.camera.updateProjectionMatrix();
        appRef.current.console(appRef.current.camera.aspect);
      },
      false
    );
  }, []);

  useEffect(() => {
    if (countRef.current === 0) {
      appRef.current.init();
      appRef.current.render();
    }
  }, []);

  return <canvas id="webgl" />;
};
export default Page002;
