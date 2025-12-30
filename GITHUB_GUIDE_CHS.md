# GitHub 新手操作指南 (Beginner's Guide)

这份文档是专为您准备的 GitHub 详细操作教程，涵盖了从**创建仓库**、**上传代码**到**删除仓库**的全过程。

---

## 1. 准备工作

确保您已经注册了 GitHub 账号：[https://github.com/](https://github.com/)

---

## 2. 如何创建新仓库 (Create Repository)

这是上传代码的第一步，您需要在 GitHub 云端创建一个"空壳"来存放您的项目。

1.  登录 GitHub。
2.  在页面右上角，点击 **"+"** 号图标，选择 **"New repository"**。
3.  **Repository name** (必填): 输入仓库名称，例如 `SVNC-Client`。
4.  **Description** (可选): 输入项目简介，例如 "A modern SVN Client built with Electron"。
5.  **Public/Private** (必选):
    -   **Public**: 公开，所有人可见（免费）。
    -   **Private**: 私有，仅您自己可见（免费）。
6.  **Initialize this repository with**: **不要勾选任何选项** (不要选 README, .gitignore 等)。因为我们本地已经有了这些文件。
7.  点击绿色的 **"Create repository"** 按钮。

创建成功后，您会看到一个全是代码指令的页面，保留该页面，我们马上要用到其中的 URL。

---

## 3. 如何上传本地代码 (Upload/Push)

现在我们将您电脑上的 `SVNC` 项目上传到刚才创建的仓库中。

### 第一步：打开终端 (Terminal)
在 VS Code 中，按 `Cmd + J` 打开下方终端，确保当前目录是项目的根目录 (`.../Projects/SVNC`)。

### 第二步：执行 Git 命令
按顺序复制并执行以下命令：

1.  **初始化仓库** (告诉电脑这个文件夹要用 Git 管理):
    ```bash
    git init
    ```

2.  **添加文件** (把所有文件放入"待提交区"):
    ```bash
    git add .
    ```
    *(注意: `.` 代表所有文件。系统会自动忽略 `.gitignore` 里指定的文件，如 node_modules)*

3.  **提交代码** (将代码保存一个版本到本地):
    ```bash
    git commit -m "First Interaction: Upload V1.0"
    ```

4.  **重命名主分支**:
    ```bash
    git branch -M main
    ```

5.  **关联远程仓库** (关键步骤):
    - 请回到刚才 GitHub 网页，找到那行类似 `https://github.com/用户名/仓库名.git` 的地址。
    - 执行命令 (替换为您真实的地址):
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/SVNC-Client.git
    ```

6.  **推送到云端**:
    ```bash
    git push -u origin main
    ```

执行完第 6 步后，终端可能会提示您输入 GitHub 的用户名和密码（或 Token）。上传完成后，刷新 GitHub 网页，您就能看到所有代码了！

---

## 4. 日常更新代码

以后您修改了代码，想要同步到 GitHub，只需执行这三步：

1.  `git add .` (添加修改)
2.  `git commit -m "这里写修改了什么"` (确认修改)
3.  `git push` (推送到云端)

---

## 5. 如何删除仓库 (Delete Repository)

如果您建错了仓库，或者想删掉重来：

1.  进入该仓库的 GitHub 页面。
2.  点击上方的 **"Settings"** (齿轮图标)。
3.  滑动页面直到**最底部**，找到红色区域 (Danger Zone)。
4.  点击最后一行 **"Delete this repository"**。
5.  系统会弹框要求二次确认：
    - 点击按钮 "I want to delete this repository"。
    - 点击 "I have read and understand these effects"。
    - 输入提示的文字（通常是 `用户名/仓库名`）以确认。
    - 点击 "Delete this repository"。

**注意**：删除操作是不可逆的，删除后代码无法找回！

---

## 6. 如何发布版本 (Releases)

当您开发完成一个阶段（比如 V1.0），可以发布一个 Release，供用户直接下载安装包。

1.  **进入 Release 页面**:
    - 在 GitHub 仓库首页右侧边栏，找到 "Releases" 区域。
    - 点击 **"Create a new release"**。

2.  **填写版本信息**:
    - **Choose a tag**: 输入版本号（如 `v1.0.0`），点击 "Create new tag"。
    - **Release title**: 输入标题，如 "V1.0 - Initial Release"。
    - **Describe this release**: 填写更新日志。可以点击右上角的 "Generate release notes" 自动生成（基于 git commit）。

3.  **上传附件 (Assets)**:
    - 将您本地打包好的文件（`.dmg`, `.zip`, `.exe` 等）拖入下方的虚线框区域。
    - 注意：这些文件在您的 `dist/electron` 目录下。

4.  **发布**:
    - 勾选 "Set as the latest release"（默认已选）。
    - 点击绿色的 **"Publish release"** 按钮。

---

## 7. 问题与贡献管理 (Issues & PRs)

### Issues (问题追踪)
用户可以在这里提出 Bug 或建议。
- **查看 Issue**: 点击顶部 "Issues" 标签。
- **回复**: 进入 Issue，在下方评论区回复。
- **关闭**: 问题解决后，点击 "Close issue"。
- **Tip**: 您可以给 Issue 打标签 (Labels)，如 `bug`, `enhancement` (功能增强)。

### Pull Requests (PR / 代码合并)
如果其他人想为您的项目贡献代码，他们会发起 PR。
1.  **查看 PR**: 点击顶部 "Pull requests" 标签。
2.  **Review (审查)**: 点击 PR 标题，进入 "Files changed" 查看对方改了什么代码。
3.  **Merge (合并)**:
    - 如果代码没问题，点击绿色的 **"Merge pull request"** 按钮。
    - 点击 "Confirm merge"。
    - 这时对方的代码就真正合并进您的仓库了。

---
*祝您的开源之旅愉快！*
