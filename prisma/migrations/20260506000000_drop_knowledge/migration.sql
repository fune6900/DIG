-- 未使用となった Knowledge テーブルを撤去する。
-- アプリコード側に参照は無く、schema.prisma にもモデル定義は残っていない。
-- IF EXISTS で本番反映済み・未反映どちらの環境でも安全に流せるようにする。

DROP TABLE IF EXISTS "Knowledge" CASCADE;
