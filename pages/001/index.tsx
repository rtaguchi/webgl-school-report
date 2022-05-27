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
  materialEven: any; // マテリアル
  materialOdd: any; // マテリアル
  boxArray: any; // ボックスメッシュ
  controls: any; // オービットコントロール
  axesHelper: any; // 軸ヘルパー
  isDown: any; // キーの押下状態を保持するフラグ
  lightAngle: any;
  lightAngle2: any;

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
      near: 1.0,
      // 描画する空間のファークリップ面（最遠面）
      far: 61.0,
      // カメラの位置
      x: 0.0,
      y: 0.0,
      z: 31.0,
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
  static get MATERIAL_PARAM1() {
    return {
      color: 0x98a3d2, // マテリアルの基本色
    };
  }
  static get MATERIAL_PARAM2() {
    return {
      color: 0x6f74a0, // マテリアルの基本色
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.isDown = false; // キーの押下状態を保持するフラグ

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
    this.geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);

    // マテリアル @@@
    // - 反射光を表現できるマテリアル -----------------------------------------
    // MeshLambertMaterial は拡散光を表現できますが、MeshPhongMaterial を利用す
    // ると拡散光に加えて反射光を表現することができます。
    // 反射光の外見上の特徴としては、拡散光よりもより強いハイライトが入ります。
    // また、視点（カメラ）の位置によって見え方に変化が表れるのも拡散光には見ら
    // れない反射光ならではの現象です。
    // ------------------------------------------------------------------------
    this.materialEven = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM1);
    this.materialOdd = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM2);

    // メッシュ
    this.boxArray = [];
    for (let i = -20; i < 20; i++) {
      for (let j = -20; j < 20; j++) {
        const box = new THREE.Mesh(
          this.geometry,
          (i + j) % 2 === 0 ? this.materialEven : this.materialOdd
        );
        box.position.x = i + 0.5 * i;
        box.position.y = j + 0.5 * j;

        box.rotation.x = 0.03 * (i + j);

        this.scene.add(box);
        this.boxArray.push({ box, direction: true });
      }
    }

    // this.box = new THREE.Mesh(this.geometry, this.material);

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    // const axesBarLength = 5.0;
    // this.axesHelper = new THREE.AxesHelper(axesBarLength);
    // this.scene.add(this.axesHelper);
  }

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    // コントロールを更新
    this.controls.update();

    // フラグに応じてオブジェクトの状態を変化させる
    if (this.isDown === true) {
      this.boxArray.forEach((dict: any) => {
        dict.direction = true;
        dict.box.rotation.y += 0.01;
      });
    } else {
      this.boxArray.forEach((dict: any) => {
        if (dict.box.position.z > 32.0) {
          dict.direction = false;
        } else if (dict.box.position.z < -32.0) {
          dict.direction = true;
        } else {
          if (Math.floor(Math.random() * 500) % 500 === 0) {
            dict.direction = !dict.direction;
          }
        }

        if (dict.direction) {
          dict.box.rotation.x += 0.03;
          dict.box.position.z += 0.05;
        } else {
          dict.box.rotation.x -= 0.03;
          dict.box.position.z -= 0.05;
        }
      });
    }

    this.lightAngle += 0.01;
    this.lightAngle2 += 0.02;
    this.spotLight.position.x = Math.cos(this.lightAngle) * 40;
    this.spotLight.position.z = Math.sin(this.lightAngle) * 40;
    this.spotLight2.position.x = Math.cos(this.lightAngle2) * 40;
    this.spotLight2.position.z = Math.sin(this.lightAngle2) * 40;

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }

  console(text: string | number) {
    console.log(text);
  }
}

const Page001: NextPage = () => {
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
export default Page001;
