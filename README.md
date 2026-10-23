# dsh-goal-unlimited

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) の goal から、ラウンド数の上限をなくすプラグインです。

DSH の goal には `maxGoalRounds`（既定 256）があり、そのラウンド数に達すると goal は止まります（blocked）。

- 新しい goal の既定値を、DSH が受け付ける最大値（`9007199254740991`）にします（`goal` の `defaultMaxGoalRounds`）。
- モデルが `create_goal` で上限を指定した goal や、すでにセッションにある goal も、作成・変更・読み込みのたびに同じ値へ引き上げます。

上限以外の goal の動き（止める・再開する・完了にする）は変えません。

## 導入

```sh
dsh plugin --profile web add "file:$PWD"
```

## テスト

```sh
npm test
```

## ライセンス

MIT
