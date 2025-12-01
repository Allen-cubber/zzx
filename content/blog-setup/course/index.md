---
title: 博客搭建教程
date: 2025-08-30T11:00:00+08:00
summary: 本文档记录了使用 Hugo 静态网站生成器、PaperMod 主题，并结合 Vercel 和 Cloudflare 服务，从零开始搭建一个功能强大、样式精美、全球高速访问的个人博客的完整流程。
tags:
  - 博客搭建
  - 网页开发
---
## 博客搭建指南：从 Hugo + PaperMod 到 Vercel + Cloudflare

本文档记录了使用 Hugo 静态网站生成器、PaperMod 主题，并结合 Vercel 和 Cloudflare 服务，从零开始搭建一个功能强大、样式精美、全球高速访问的个人博客的完整流程。

### 目录

1.  **基础准备与本地环境搭建**
2.  **内容创作与组织**
3.  **高级功能配置 (数学公式, 图表, 目录)**
4.  **部署上线 (Git, Vercel)**
5.  **全球加速与自定义域名 (Cloudflare)**
6.  **个性化美化**
7.  **日常维护与工作流**

---

### 1. 基础准备与本地环境搭建

#### 1.1 安装 Hugo
确保安装 **extended** 版本，因为现代主题大多需要它。
```powershell
# Windows (使用 Scoop)
scoop install hugo-extended
# Windows (使用 Winget)
winget install Hugo.Hugo.Extended
```
检查安装成功并记下版本号，后续部署会用到：
```bash
hugo version
```

#### 1.2 创建新站点
```bash
# 在你喜欢的位置创建一个新的 Hugo 站点，例如 your_hugo
hugo new site your_hugo
cd your_hugo
```

#### 1.3 初始化 Git
在项目最开始就初始化 Git，并创建 `.gitignore` 文件。
```bash
git init
git branch -M main
```
在 `zzx` 根目录创建 `.gitignore` 文件，并写入以下内容以忽略生成文件：
```
/public/
/resources/
hugo_stats.json
```

#### 1.4 安装 PaperMod 主题
采用最稳定的直接下载方式，避免 Git Submodule 的复杂性。
1.  从 [PaperMod GitHub 页面](https://github.com/adityatelange/hugo-PaperMod/archive/refs/heads/master.zip) 下载 ZIP 包。
2.  解压后得到 `hugo-PaperMod-master` 文件夹。
3.  在 your_hugo 目录下创建 `themes` 文件夹。
4.  将 `hugo-PaperMod-master` 文件夹复制到 `themes` 目录中，并**重命名为 `papermod`**。

#### 1.5 基础配置 (`hugo.yaml`)
这是你的网站“大脑”。在 your_hugo 根目录创建/修改 `hugo.yaml` 文件，写入以下基础配置：
```yaml
baseURL: 'https://www.your-domain.com/' # 最终换成你的域名
languageCode: 'zh-cn'
title: 'Your_Hugo'
theme: 'papermod'

# 主题参数，用于控制功能
params:
  ShowShareButtons: true
  ShowReadingTime: true
  ShowPostNavLinks: true
  ShowCodeCopyButtons: true
  
  # 开启目录功能的全局开关
  ShowToc: true
  TocOpen: true # 让目录默认展开

  # 开启 KaTeX 数学公式渲染的全局开关
  math: true

# Markdown 渲染器配置
markup:
  goldmark:
    renderer:
      # 必须开启，允许 KaTeX 和 HTML 标签通过
      unsafe: true
  tableOfContents:
    startLevel: 2  # 目录从 ## (h2) 开始
    endLevel: 3    # 目录到 ### (h3) 结束
    ordered: false # 目录使用无序列表
```

---

### 2. 内容创作与组织

#### 2.1 创建文章 (最佳实践)
使用**页面捆绑 (Page Bundles)** 的方式，将文章和其配图放在一起。
```bash
# 创建一篇名为 my-first-post 的文章
hugo new posts/my-first-post/index.md
```
这会在 `content/posts/` 下创建一个 `my-first-post` 文件夹，里面包含一个 `index.md` 文件。

#### 2.2 发布文章
新创建的文章默认为草稿。用文本编辑器打开 `.md` 文件，找到并**删除 `draft: true`** 这一行，文章才能被发布。

#### 2.3 组织内容分区
通过在 `content` 目录下创建子文件夹来建立分区。
1.  在 `content` 目录下创建 `notes`, `musings` 等文件夹。
2.  在 `hugo.yaml` 中配置顶部菜单，将分区链接添加进去：
    ```yaml
    menu:
      main:
        - name: Study Notes # 菜单显示名
          url: "/notes/"   # 链接到 content/notes/ 文件夹
          weight: 10       # 排序权重，数字越小越靠前
        - name: Musings
          url: "/musings/"
          weight: 20
    ```

#### 2.4 添加图片
将图片文件（如 `cover.png`）直接放到与 `index.md` **相同的文件夹**下，然后在 Markdown 中用相对路径引用：
```markdown
![图片描述](cover.png)
```

#### 2.5 使用 Front Matter (笔记属性)
为每篇文章添加丰富的元数据，以增强功能和组织性。
```yaml
---
title: "文章标题"
date: 2024-08-01T10:00:00+08:00
draft: false # 确保已发布
summary: "这是一段吸引人的文章摘要..."
tags: ["标签A", "标签B"]
categories: ["分类"]
series: ["系列教程"]
Toc: true     # 为这篇文章开启目录
math: true    # 为这篇文章开启数学公式渲染
---
```

---

### 3. 高级功能配置

#### 3.1 渲染数学公式 (KaTeX)
1.  确保 `hugo.yaml` 中已配置 `params.math: true` 和 `markup.goldmark.renderer.unsafe: true`。
2.  在需要渲染公式的文章 Front Matter 中添加 `math: true`。
3.  **LaTeX 转义黄金法则**: 在 Markdown 中书写复杂公式时，必须对特殊字符进行转义：
    *   **命令 `\`**: 写成 `\\` (e.g., `\\frac`)
    *   **下标 `_`**: 写成 `\_` (e.g., `a\_i`)
    *   **共轭 `*`**: 写成 `\*` (e.g., `H\*`)
    *   **矩阵换行 `\\`**: 写成 `\\\\` (四个反斜杠)

#### 3.2 渲染图表 (Mermaid.js)
采用最高效、官方推荐的“按需加载”方案。
1.  **创建 `layouts/_default/_markup/render-codeblock-mermaid.html`** 文件，内容如下：
    ```html
    <div class="mermaid">
      {{- .Inner | safeHTML }}
    </div>
    {{ .Page.Store.Set "hasMermaid" true }}
    ```
2.  **覆盖 `layouts/_default/baseof.html`**：从 `themes/papermod/layouts/_default/` 复制 `baseof.html` 到你项目的 `layouts/_default/` 下，并在 `</body>` 标签前添加：
    ```html
    {{ if .Store.Get "hasMermaid" }}
      <script type="module">
        import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.js';
        let theme = document.body.classList.contains('dark') ? 'dark' : 'default';
        mermaid.initialize({ startOnLoad: true, theme: theme });
      </script>
    {{ end }}
    ```
3.  在 Markdown 中使用标准代码围栏编写图表，**前后必须有空行**：
    ````markdown

    ```mermaid
    graph TD;
        A --> B;
    ```

    ````

#### 3.3 添加目录 (TOC)
1.  确保 `hugo.yaml` 中已配置 `params.ShowToc: true`。
2.  在需要显示目录的文章 Front Matter 中添加 `Toc: true`。
3.  确保文章正文中有**至少 3 个**二级 (`##`) 或三级 (`###`) 标题。

---

### 4. 部署上线 (Git, Vercel)

1.  **本地预览**：随时运行 `hugo server` 在 `http://localhost:1313` 预览效果。
2.  **推送到 GitHub**：
    *   在 GitHub 上创建一个空的远程仓库。
    *   在本地项目文件夹中，执行：
        ```bash
        git remote add origin <你的仓库URL>
        git add .
        git commit -m "你的提交信息"
        git push -u origin main
        ```
3.  **连接 Vercel**：
    *   使用 GitHub 账户登录 Vercel。
    *   导入你刚刚创建的 GitHub 仓库。
    *   **配置 Vercel**:
        *   **Framework Preset**: `Hugo`
        *   **Build Command**: `hugo --gc`
        *   **Output Directory**: `public`
        *   **Environment Variables**: 添加一个名为 `HUGO_VERSION` 的变量，值为你用 `hugo version` 查到的版本号。
    *   点击 "Deploy"。

---

### 5. 全球加速与自定义域名 (Cloudflare)

#### 5.1 购买域名
在阿里云、腾讯云等服务商购买一个你喜欢的域名，并完成实名认证。

#### 5.2 接入 Cloudflare (免费)
1.  注册 Cloudflare 账户，添加你的域名。
2.  在你的**域名注册商**（如阿里云）后台，将 DNS 服务器地址**修改为 Cloudflare 提供的那两个**。
3.  等待 DNS 生效。
4.  在 Cloudflare 的 DNS 管理页面，**添加两条 CNAME 记录**：
    *   **记录一**: 类型 `CNAME`, 名称 `@`, 目标 `cname.vercel-dns.com`, 代理状态 **橙色云 (已代理)**。
    *   **记录二**: 类型 `CNAME`, 名称 `www`, 目标 `cname.vercel-dns.com`, 代理状态 **橙色云 (已代理)**。

#### 5.3 在 Vercel 添加域名
1.  在 Vercel 项目的 "Domains" 设置中，添加你的域名（如 `your-domain.com`）。
2.  Vercel 会自动验证 DNS 设置，并推荐你将根域名跳转到 `www` 版本。

#### 5.4 更新 `baseURL`
最后，将你 `hugo.yaml` 文件中的 `baseURL` **更新为你自己的最终域名**（如 `https://www.your-domain.com/`），然后 `git push` 部署。

---

### 6. 个性化美化

所有个性化样式都通过创建并编辑 `assets/css/extended/custom.css` 文件来实现。

*   **更换网站图标 (Favicon)**：
    1.  使用 [favicon.io](https://favicon.io/) 等工具生成图标集。
    2.  将所有生成的图标文件（`favicon.ico`, `apple-touch-icon.png` 等）**全部放到 `static` 文件夹的根目录**。
    3.  （可选）在 `layouts/partials/extend_head.html` 中添加 Favicon 生成器提供的 `<link>` 标签，以确保最高优先级。

*   **添加首页背景图**：
    ```css
    body.home.list {
        background-image: url('/images/your-bg.jpg'); /* 图片需放在 static/images/ */
        background-size: cover;
        background-position: center;
        background-attachment: fixed;
    }
    /* 添加遮罩层以保证文字可读性 */
    body.home.list::before {
        content: '';
        position: fixed;
        top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0, 0, 0, 0.5); /* 半透明黑色 */
        z-index: -1;
    }
    ```

*   **调整正文宽度**：
    ```css
    :root {
        --main-width: 1400px; /* 默认是 1200px */
    }
    ```

---

### 7. 日常维护与工作流

*   **标准工作流**：
    1.  在本地创建或修改 `.md` 文件。
    2.  运行 `hugo server` 进行实时预览和调试。
    3.  满意后，执行 `git add .`, `git commit -m "..."`, `git push`。
    4.  Vercel 会自动完成部署，几分钟后线上网站即更新。
*   **Obsidian 联动**：
    *   **注意图片链接**：Obsidian 的 `![[...]]` 语法与标准 Markdown `![...](...)` 不兼容。
    *   **推荐插件**：使用如 `Hugo Publish` 等 Obsidian 社区插件，可以在发布前自动转换链接格式并同步文件，极大提升效率。但请仔细阅读插件说明，避免破坏原始文件。
*   **文件管理**：
    *   **批量重命名**：使用 PowerShell 或 PowerToys 等工具，将文件名中的空格替换为 `-`，并转换为小写，以保持 URL 友好。