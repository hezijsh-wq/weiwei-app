# 接入邮箱登录与私人云端存档

本应用使用 Supabase Auth 与受行级权限保护的 Postgres 私人存档。未配置时，访客仍可浏览和使用原有本地功能；不会伪装成已登录。

## 一次性配置

1. 在 Supabase 创建项目。数据库密码保留在自己的密码管理器，不要发到聊天或写入仓库。
2. 在 SQL Editor 执行仓库里的 `supabase/schema.sql`。
3. 在 Authentication / Providers 中启用 Email。登录邮件模板需包含 `{{ .Token }}` 数字验证码，而非仅确认链接。可接受 6–10 位数字；默认验证码有效期由 Supabase 管理。
4. 正式对外开放前配置 SMTP，并核验发送域名。Supabase 默认邮件服务的收件人和发送频率有限制，不适合公开运营。
5. 在 Vercel 项目 Settings / Environment Variables 中设置：
   - `SUPABASE_URL`：项目 HTTPS URL。
   - `SUPABASE_PUBLISHABLE_KEY`：项目 publishable key（或传统 anon key）。可用于客户端；绝不能使用 secret 或 service_role key。
6. 重新部署 Vercel。`/api/config` 未配置时只返回 `configured:false`，不会返回环境变量全集或服务密钥。

也兼容 Vercel 集成常用的 `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`。密钥只通过环境设置输入，不要粘贴到聊天。

## 存档与隐私

- 邮箱验证码验证成功后才建立会话；会话保存在当前标签页 sessionStorage，支持过期刷新。
- 登录不会自动上传本地内容。用户主动点击上传后，才保存昵称、收藏、私人手账与徽章展示。
- 同步是手动的：上传本机存档、读取云端存档。上传带版本检查，其他设备已更新时拒绝覆盖；用户可先导出本机备份，再读取云端版本。
- 社区帖子、公开评论及点赞目前仍为本地演示，不进入私人云存档，也不伪装成多人社区。
- 服务端根据认证用户确定 user_id，前端不能指定其他用户。RLS 禁止匿名读取和跨用户读取；写入仅经受限 RPC 完成。
- 云端数据恢复到页面内存，不写入访客 localStorage。登录前本机状态保留；退出恢复访客状态，防止将其他账号数据带入。
- 目前不包括账号注销、自助数据删除、正式活动徽章认证和在线社区。公开运营前需补齐，并执行下述真实服务检查。

## 验证

配置后必须使用真实测试邮箱检查发送、验证码失败/过期、登录、刷新会话、退出、上传与换设备恢复。使用两个不同账号确认无法访问对方存档；匿名读取应失败。同一账号两台设备同时上传，后者应得到版本冲突提示。

本地 UI 的模拟响应测试仅验证前端流程，不代表真实邮件、RLS 或线上数据库已经验证。
