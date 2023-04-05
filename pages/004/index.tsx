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
  offscreenScene: any; // シーン
  camera: any; // カメラ
  offscreenCamera: any;
  directionalLight: any; // ディレクショナルライト
  plane: any;
  renderTarget: any;
  blackColor: any;
  whiteColor: any;
  ambientLight: any; // アンビエントライト
  material: any; // マテリアル
  hitMaterial: any; // レイが交差した場合用のマテリアル @@@
  torusGeometry: any; // トーラスジオメトリ
  torusArray: any; // トーラスメッシュの配列
  controls: any; // オービットコントロール
  axesHelper: any; // 軸ヘルパー
  group: any; // グループ
  texture: any; // テクスチャ
  isDown: any;
  isClicked: any;
  raycaster: any;

  /**
   * カメラ定義のための定数
   */
  static get CAMERA_PARAM() {
    return {
      fovy: 60,
      aspect: window.innerWidth / window.innerHeight,
      near: 0.1,
      far: 20.0,
      x: 0.0,
      y: 2.0,
      z: 10.0,
      lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
    };
  }
  /**
   * レンダラー定義のための定数
   */
  static get RENDERER_PARAM() {
    return {
      clearColor: 0xffffff,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }
  /**
   * ディレクショナルライト定義のための定数
   */
  static get DIRECTIONAL_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 1.0,
      x: 1.0,
      y: 1.0,
      z: 1.0,
    };
  }
  /**
   * アンビエントライト定義のための定数
   */
  static get AMBIENT_LIGHT_PARAM() {
    return {
      color: 0xffffff,
      intensity: 0.2,
    };
  }
  /**
   * レンダーターゲットの大きさ @@@
   */
  static get RENDER_TARGET_SIZE() {
    return 1024;
  }
  /**
   * マテリアル定義のための定数
   */
  static get MATERIAL_PARAM() {
    return {
      color: 0xffffff,
    };
  }
  /**
   * レイが交差した際のマテリアル定義のための定数 @@@
   */
  static get INTERSECTION_MATERIAL_PARAM() {
    return {
      color: 0x00ff00,
    };
  }
  /**
   * フォグの定義のための定数
   */
  static get FOG_PARAM() {
    return {
      fogColor: 0xffffff,
      fogNear: 10.0,
      fogFar: 20.0,
    };
  }

  /**
   * コンストラクタ
   * @constructor
   */
  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.isDown = false; // キーの押下状態を保持するフラグ
    this.isClicked = false;

    // 再帰呼び出しのための this 固定
    this.render = this.render.bind(this);
  }

  /**
   * アセット（素材）のロードを行う Promise
   */
  load() {
    return new Promise<void>((resolve) => {
      // 読み込む画像のパス
      const imagePath = "/sample_texture.jpg";
      const loader = new THREE.TextureLoader();
      loader.load(imagePath, (texture) => {
        this.texture = texture;
        resolve();
      });
    });
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

    // シーンとフォグ
    this.scene = new THREE.Scene();
    this.offscreenScene = new THREE.Scene();

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
    this.offscreenScene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      App3.AMBIENT_LIGHT_PARAM.color,
      App3.AMBIENT_LIGHT_PARAM.intensity
    );
    this.offscreenScene.add(this.ambientLight);

    // マテリアル
    this.material = new THREE.MeshPhongMaterial(App3.MATERIAL_PARAM);
    this.material.map = this.texture;
    // 交差時に表示するためのマテリアルを定義 @@@
    this.hitMaterial = new THREE.MeshPhongMaterial(
      App3.INTERSECTION_MATERIAL_PARAM
    );
    this.hitMaterial.map = this.texture;

    // グループ
    this.group = new THREE.Group();
    this.offscreenScene.add(this.group);

    // トーラスメッシュ
    const TORUS_COUNT = 10;
    const TRANSFORM_SCALE = 5.0;
    this.torusGeometry = new THREE.TorusGeometry(0.5, 0.2, 8, 16);
    this.torusArray = [];
    for (let i = 0; i < TORUS_COUNT; ++i) {
      const torus = new THREE.Mesh(this.torusGeometry, this.material);
      torus.position.x = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
      torus.position.y = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
      torus.position.z = (Math.random() * 2.0 - 1.0) * TRANSFORM_SCALE;
      this.group.add(torus);
      this.torusArray.push(torus);
    }

    // コントロール
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // ヘルパー
    const axesBarLength = 5.0;
    this.axesHelper = new THREE.AxesHelper(axesBarLength);
    this.offscreenScene.add(this.axesHelper);

    // レンダーターゲットをアスペクト比 1.0 の正方形で生成する @@@
    this.renderTarget = new THREE.WebGLRenderTarget(
      App3.RENDER_TARGET_SIZE,
      App3.RENDER_TARGET_SIZE
    );

    // オフスクリーン用のカメラは、この時点でのカメラの状態を（使いまわして手間軽減のため）クローンしておく @@@
    this.offscreenCamera = this.camera.clone();
    // ただし、最終シーンがブラウザのクライアント領域のサイズなのに対し……
    // レンダーターゲットは正方形なので、アスペクト比は 1.0 に設定を上書きしておく
    this.offscreenCamera.aspect = 1.0;
    this.offscreenCamera.updateProjectionMatrix();

    // レンダリング結果を可視化するのに、板ポリゴンを使う @@@
    const planeGeometry = new THREE.PlaneGeometry(5.0, 5.0);
    const planeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.plane = new THREE.Mesh(planeGeometry, planeMaterial);

    // 板ポリゴンのマテリアルには、レンダーターゲットに描き込まれた結果を投影したいので……
    // マテリアルの map プロパティにレンダーターゲットのテクスチャを割り当てておく @@@
    planeMaterial.map = this.renderTarget.texture;

    // 板ポリゴンをシーンに追加
    this.scene.add(this.plane);

    // 背景色を出し分けるため、あらかじめ Color オブジェクトを作っておく @@@
    this.blackColor = new THREE.Color(0x000000);
    this.whiteColor = new THREE.Color(0xffffff);
  }

  /**
   * 描画処理
   */
  render() {
    // console.count("render");
    requestAnimationFrame(this.render);
    this.controls.update();
    if (this.isDown === true) {
      this.group.rotation.y += 0.05;
    }
    if (this.isClicked === true) {
      this.plane.rotation.z += 0.02;
    }

    // まず最初に、オフスクリーンレンダリングを行う @@@
    this.renderer.setRenderTarget(this.renderTarget);
    // オフスクリーンレンダリングは常に固定サイズ
    this.renderer.setSize(App3.RENDER_TARGET_SIZE, App3.RENDER_TARGET_SIZE);
    // わかりやすくするために、背景を黒にしておく
    this.renderer.setClearColor(this.whiteColor, 1.0);
    // オフスクリーン用のシーン（Duck が含まれるほう）を描画する
    this.renderer.render(this.offscreenScene, this.offscreenCamera);

    // 次に最終的な画面の出力用のシーンをレンダリングするため null を指定しもとに戻す @@@
    this.renderer.setRenderTarget(null);
    // 最終的な出力はウィンドウサイズ
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // わかりやすくするために、背景を白にしておく
    this.renderer.setClearColor(this.blackColor, 1.0);
    // 板ポリゴンが１枚置かれているだけのシーンを描画する
    this.renderer.render(this.scene, this.camera);
  }

  console(text: string | number) {
    console.log(text);
  }

  click(x: number, y: number) {
    // 上下が反転している点に注意
    const v = new THREE.Vector2(x, -y);
    // レイキャスターに正規化済みマウス座標とカメラを指定する
    this.raycaster.setFromCamera(v, this.camera);
    // scene に含まれるすべてのオブジェクトを対象にレイキャストする
    const intersect = this.raycaster.intersectObject(this.plane);
    if (intersect.length > 0) {
      this.isClicked = true;
    } else {
      this.isClicked = false;
    }

    // // レイが交差しなかった場合を考慮し一度マテリアルをリセットしておく
    // this.torusArray.forEach((mesh: THREE.Mesh) => {
    //   mesh.material = this.material;
    // });

    // // - intersectObjects でレイキャストした結果は配列 ----------------------
    // // 名前が似ているので紛らわしいのですが Raycaster には intersectObject と
    // // intersectObjects があります。複数形の s がついているかどうかの違いがあ
    // // り、複数形の場合は引数と戻り値のいずれも配列になります。
    // // この配列の長さが 0 である場合はカーソル位置に向かって放ったレイは、どの
    // // オブジェクトとも交差しなかったと判断できます。また、複数のオブジェクト
    // // とレイが交差した場合も、three.js 側で並び替えてくれるので 0 番目の要素
    // // を参照すれば必ず見た目上の最も手前にあるオブジェクトを参照できます。
    // // 戻り値の中身は object というプロパティを経由することで対象の Mesh など
    // // のオブジェクトを参照できる他、交点の座標などもわかります。
    // // ----------------------------------------------------------------------
    // if (intersects.length > 0) {
    //   intersects[0].object.material = this.hitMaterial;
    // }
    console.log(this.isClicked);
  }
}

const Page004: NextPage = () => {
  // 制御クラスのインスタンスを生成
  const appRef = useRef(new App3());
  const countRef = useRef(0);

  const handleClick = (mouseEvent: any) => {
    // スクリーン空間の座標系をレイキャスター用に正規化する（-1.0 ~ 1.0 の範囲）
    const x = (mouseEvent.clientX / window.innerWidth) * 2.0 - 1.0;
    const y = (mouseEvent.clientY / window.innerHeight) * 2.0 - 1.0;
    appRef.current.click(x, y);
  };

  useEffect(() => {
    console.log("useEffect initial");
    window.addEventListener("click", handleClick, false);

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

    return () => {
      window.removeEventListener("click", handleClick, false);
    };
  }, []);

  useEffect(() => {
    if (countRef.current === 0) {
      appRef.current.load().then(() => {
        appRef.current.init();
        appRef.current.render();
      });
    }
  }, []);

  return <canvas id="webgl" />;
};
export default Page004;
