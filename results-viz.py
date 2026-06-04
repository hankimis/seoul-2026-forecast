"""Result visuals for the 2026 forecast scorecard -> docs/results/."""
import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from PIL import Image
from matplotlib.lines import Line2D

plt.rcParams["font.family"] = "AppleGothic"
plt.rcParams["axes.unicode_minus"] = False
plt.rcParams["figure.dpi"] = 140

ROOT = Path("/Users/hankim/seoul-2026-forecast")
OUT = ROOT / "docs" / "results"
OUT.mkdir(parents=True, exist_ok=True)

BLUE, RED, GREEN, GOLD, GREY, INK = "#2e6fb0", "#c0392b", "#2a7f3f", "#c9962a", "#8a8f98", "#222831"

fc = json.loads((ROOT / "forecast-national.json").read_text())
act = json.loads((ROOT / "data" / "results-2026-actual.json").read_text())["regions"]
P = {r["region"]: r for r in fc}

KH = {"서울", "대구", "경북", "경남"}  # 국힘 won
pos = {
    "서울": [0, 3], "인천": [0, 2], "경기": [0, 4], "강원": [0, 6],
    "충남": [1, 2], "세종": [1, 3], "충북": [1, 4], "경북": [1, 6],
    "전북": [2, 1], "대전": [2, 3], "대구": [2, 6],
    "전남광주": [3, 1], "경남": [3, 4], "부산": [3, 5], "울산": [3, 6],
    "제주": [4, 1],
}
MAXROW = 4
regions = list(pos.keys())

rows = []
for reg in regions:
    f = P[reg]; a = act.get(reg)
    pred_win_D = f["dwin"] >= 0.5
    act_win_D = reg not in KH
    twoway_act = (100 * a["D_pct"] / (a["D_pct"] + a["P_pct"])) if a else None
    rows.append(dict(reg=reg, dwin=f["dwin"], pred_win_D=pred_win_D, act_win_D=act_win_D,
                     hit=(pred_win_D == act_win_D), twoway_pred=f["predicted_twoway_D"],
                     twoway_act=twoway_act))

n = len(rows)
hits = sum(r["hit"] for r in rows)
win_acc = 100 * hits / n
brier = float(np.mean([(P[r["reg"]]["dwin"] - (1 if r["act_win_D"] else 0)) ** 2 for r in rows if act.get(r["reg"])]))
tw = [abs(r["twoway_pred"] - r["twoway_act"]) for r in rows if r["twoway_act"] is not None]
tw_mae = float(np.mean(tw)); tw_within3 = sum(1 for e in tw if e <= 3)
seats_act = sum(1 for r in rows if r["act_win_D"])
print(f"winner {hits}/{n}={win_acc:.1f}%  Brier {brier:.3f}  twoMAE {tw_mae:.2f}  two<=3 {tw_within3}/{len(tw)}  민주seats {seats_act}")

# scoreboard
fig, ax = plt.subplots(figsize=(9.2, 4.6)); ax.axis("off")
ax.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax.transAxes, facecolor="#0f1620", zorder=0))
ax.text(0.5, 0.90, "2026 광역단체장 예측 채점", transform=ax.transAxes, ha="center", fontsize=17, weight="bold", color="white")
ax.text(0.5, 0.805, "사전등록(git 05-30) 예측 vs 확정 개표", transform=ax.transAxes, ha="center", fontsize=10.5, color="#9fb0c3")
def cell(x, big, small, color):
    ax.text(x, 0.50, big, transform=ax.transAxes, ha="center", fontsize=32, weight="bold", color=color)
    ax.text(x, 0.30, small, transform=ax.transAxes, ha="center", fontsize=11, color="#c8d2de")
cell(0.16, f"{hits}/16", "당선 적중", GREEN)
cell(0.385, f"{win_acc:.1f}%", "총 정확도", GREEN)
cell(0.615, "12 = 12", "의석 중앙값 = 실제", GOLD)
cell(0.84, f"{brier:.3f}", "Brier (무지 0.25)", BLUE)
ax.text(0.5, 0.085, f"양자 득표율 MAE {tw_mae:.1f}pt   ·   미스 2곳: 서울·경남 (최접전 국힘 역전)",
        transform=ax.transAxes, ha="center", fontsize=10.5, color="#9fb0c3")
fig.tight_layout(); fig.savefig(OUT / "scoreboard.png", bbox_inches="tight", facecolor="#0f1620"); plt.close(fig); print("scoreboard.png")

# pred vs actual two-way
fig, ax = plt.subplots(figsize=(7.6, 7.0))
ax.fill_between([0, 100], [-3, 97], [3, 103], color=GREEN, alpha=0.08, zorder=0, label="±3pt 밴드")
ax.plot([0, 100], [0, 100], "--", color=GREY, lw=1.2, zorder=1)
for r in rows:
    if r["twoway_act"] is None: continue
    c = GREEN if r["hit"] else RED
    ax.scatter(r["twoway_pred"], r["twoway_act"], s=70, color=c, zorder=3, edgecolor="white", linewidth=0.8)
    dx = 1.4 if r["reg"] not in ("서울", "경남") else -1.4
    ax.annotate(r["reg"], (r["twoway_pred"], r["twoway_act"]), xytext=(r["twoway_pred"]+dx, r["twoway_act"]),
                fontsize=8.5, va="center", ha=("left" if dx > 0 else "right"), color=INK)
ax.axhline(50, color=GREY, lw=0.7, alpha=0.5); ax.axvline(50, color=GREY, lw=0.7, alpha=0.5)
ax.set_xlabel("예측 양자 민주 득표율 (%)"); ax.set_ylabel("실제 양자 민주 득표율 (%)")
ax.set_title("예측 vs 실제 (양자 득표율)\n초록=당선 적중, 빨강=미스(서울·경남). 대각선=완벽 예측", fontsize=12.5, weight="bold")
ax.set_xlim(20, 95); ax.set_ylim(20, 95)
for sp in ("top", "right"): ax.spines[sp].set_visible(False)
ax.grid(alpha=0.2); ax.legend(frameon=False, fontsize=9, loc="lower right")
fig.tight_layout(); fig.savefig(OUT / "pred_vs_actual.png", bbox_inches="tight"); plt.close(fig); print("pred_vs_actual.png")

# winprob dotplot
sr = sorted(rows, key=lambda r: r["dwin"])
fig, ax = plt.subplots(figsize=(8.4, 6.4))
for i, r in enumerate(sr):
    c = BLUE if r["act_win_D"] else RED
    ax.plot([0.5, r["dwin"]], [i, i], color="#ccd3db", lw=1.2, zorder=1)
    ax.scatter(r["dwin"], i, s=95, color=c, zorder=3, edgecolor="white", linewidth=0.9)
    mark = "" if r["hit"] else "  (미스)"
    ax.text(r["dwin"] + (0.018 if r["dwin"] < 0.9 else -0.018), i, f"{r['reg']}{mark}",
            va="center", ha=("left" if r["dwin"] < 0.9 else "right"), fontsize=9,
            color=(RED if not r["hit"] else INK), weight=("bold" if not r["hit"] else "normal"))
ax.axvline(0.5, color=GREY, lw=1, ls="--"); ax.set_yticks([]); ax.set_xlim(0, 1.08)
ax.set_xlabel("예측한 민주 승리 확률")
ax.set_title("예측 승리확률 vs 실제 결과\n점 색 = 실제 당선(파랑 민주 / 빨강 국힘). 미스 2곳은 경합(0.65·0.73)이었음", fontsize=12, weight="bold")
ax.legend(handles=[Line2D([0],[0],marker='o',color='w',markerfacecolor=BLUE,markersize=10,label='실제 민주 당선'),
                   Line2D([0],[0],marker='o',color='w',markerfacecolor=RED,markersize=10,label='실제 국힘 당선')],
          frameon=False, fontsize=9, loc="lower right")
for sp in ("top", "right", "left"): ax.spines[sp].set_visible(False)
ax.grid(axis="x", alpha=0.2)
fig.tight_layout(); fig.savefig(OUT / "winprob.png", bbox_inches="tight"); plt.close(fig); print("winprob.png")

# tilemaps
def draw_tilemap(ax, mode, title):
    ax.set_title(title, fontsize=13, weight="bold", pad=10)
    for reg, (rr, cc) in pos.items():
        r = P[reg]
        d = (r["dwin"] >= 0.5) if mode == "pred" else (reg not in KH)
        base = BLUE if d else RED
        x, yv = cc, MAXROW - rr
        miss = (r["dwin"] >= 0.5) != (reg not in KH)
        ax.add_patch(plt.Rectangle((x-0.46, yv-0.46), 0.92, 0.92, facecolor=base,
                     edgecolor=("black" if (mode == "actual" and miss) else "white"),
                     linewidth=(2.6 if (mode == "actual" and miss) else 1.0), zorder=2))
        ax.text(x, yv+0.10, reg.replace("전남광주", "전남"), ha="center", va="center", fontsize=8.2, color="white", weight="bold", zorder=3)
        if mode == "pred":
            ax.text(x, yv-0.20, f"{r['dwin']*100:.0f}%", ha="center", va="center", fontsize=7.2, color="white", zorder=3)
        elif miss:
            ax.text(x, yv-0.21, "역전", ha="center", va="center", fontsize=7.2, color="white", weight="bold", zorder=3)
    ax.set_xlim(0.3, 6.7); ax.set_ylim(-0.7, 4.7); ax.set_aspect("equal"); ax.axis("off")

fig, axes = plt.subplots(1, 2, figsize=(12.6, 5.2))
draw_tilemap(axes[0], "pred", "예측 (사전등록)")
draw_tilemap(axes[1], "actual", "실제 결과  (검은 테두리 = 빗나간 곳)")
fig.suptitle("타일맵: 파랑 민주 / 빨강 국힘  ·  16곳 중 14곳 적중 (서울·경남만 역전)", fontsize=12.5, weight="bold", y=1.02)
fig.tight_layout(); fig.savefig(OUT / "tilemap.png", bbox_inches="tight"); plt.close(fig); print("tilemap.png")

# blink gif
frames = []
for mode, lab in [("pred", "예측 (사전등록 05-30)"), ("actual", "실제 결과")]:
    fig, ax = plt.subplots(figsize=(6.6, 5.4)); draw_tilemap(ax, mode, lab); fig.tight_layout()
    fig.canvas.draw()
    frames.append(Image.fromarray(np.asarray(fig.canvas.buffer_rgba())).convert("P", palette=Image.ADAPTIVE)); plt.close(fig)
frames[0].save(OUT / "results_blink.gif", save_all=True, append_images=[frames[1]], duration=1100, loop=0)
print("results_blink.gif\nDONE")
