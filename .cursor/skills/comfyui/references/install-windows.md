# ComfyUI — Windows 安装速查

官方文档：[Comfy-Org/ComfyUI README](https://github.com/Comfy-Org/ComfyUI)

## 便携版

1. 下载 Windows Portable（按 GPU 选 NVIDIA / 旧卡 cuda12.6 等）
2. 解压后右键压缩包属性 → 若被阻止则「解除锁定」
3. 模型：`ComfyUI\models\checkpoints\` 等
4. 运行目录内启动 bat

## 手动安装

```powershell
git clone https://github.com/Comfy-Org/ComfyUI.git
cd ComfyUI
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu130
pip install -r requirements.txt
python main.py
```

## ComfyUI-Manager

```powershell
pip install -r manager_requirements.txt
python main.py --enable-manager
```

## 与 Forge 共享模型

1. 复制 `extra_model_paths.yaml.example` → `extra_model_paths.yaml`
2. 配置 `base_path` 指向共享 `models` 根目录
