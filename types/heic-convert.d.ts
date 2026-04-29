// heic-convert は型定義を持たないため、最低限必要な形で宣言する。
// pure JS 実装で Node 上の Buffer も ArrayBuffer も受けるが、
// このプロジェクトでは Buffer 入力 / JPEG 出力のみで使う。
declare module "heic-convert" {
  interface HeicConvertInput {
    buffer: Buffer | ArrayBufferLike;
    format: "JPEG" | "PNG";
    quality?: number;
  }
  function heicConvert(input: HeicConvertInput): Promise<ArrayBuffer>;
  export default heicConvert;
}
