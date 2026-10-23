# 评测报告: code-search-mall

| 指标 | 值 |
|---|---|
| Module@1 | 44/50 = 88.0% |
| Menu@1 | 42/50 = 84.0% |
| Menu@4 | 47/50 = 94.0% |
| Hit@5 | 45/50 = 90.0% |
| Hit@10 | 46/50 = 92.0% |
| MRR | 0.582 |
| degraded | 0/50 |
| 端到端 ms avg/p50/p90 | 2750/2832/2866 |
| 信息提取 ms avg | 241 |
| jev 决策 ms avg | 96 |
| zg 精筛 ms avg | 2413 |

## 逐条明细

| id | 查询 | 期望菜单 | 决策菜单 | Menu@1 | Hit@5 | 首命中 | ms |
|---|---|---|---|---|---|---|---|
| q01 | 后台的商品列表页面代码在哪儿,想改一下列表字段 | 商品列表 | 商品列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/service/impl/PmsProd | 3060 |
| q02 | 品牌信息维护功能在哪个页面 | 品牌管理 | 品牌管理 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsBrandC | 2863 |
| q03 | 想给商城加个新的商品类目,去哪里操作 | 商品分类 | 商品分类 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsProduc | 2867 |
| q04 | 商品的规格和参数是在哪里配置的 | 商品属性列表 | 商品属性列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsProduc | 2881 |
| q05 | 新建优惠券的入口页面在哪 | 优惠券列表 | 优惠券列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsCoupon | 2770 |
| q06 | 秒杀活动是在哪里创建的 | 秒杀活动列表 | 秒杀活动列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsFlashP | 2832 |
| q07 | 订单发货的操作界面在哪个页面 | 订单发货 | 订单发货 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/OmsOrderC | 2854 |
| q08 | 用户提交的退货申请在哪审核 | 退货申请处理 | 退货申请处理 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/OmsOrderR | 2857 |
| q09 | 给新来的运营开后台账号,在哪儿添加 | 用户列表 | 用户列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsAdminC | 2841 |
| q10 | 角色的维护页面在哪,想看看现有角色都有哪些 | 角色列表 | 角色列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsRoleCo | 2850 |
| q11 | 后台左侧导航菜单想调整,菜单在哪儿维护 | 菜单列表 | 菜单列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsMenuCo | 2843 |
| q12 | 接口资源清单在哪个页面管理 | 资源列表 | 资源列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsResour | 2866 |
| q13 | 首页banner轮播图在哪儿换图 | 广告列表 | 首页 | N | N | - | 1640 |
| q14 | 爆款人气商品推荐怎么配置 | 人气推荐 | 人气推荐 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsHomeRe | 2812 |
| q15 | 首页新品楼层的数据在哪维护 | 新品推荐 | 品牌推荐 | N | N | - | 2817 |
| q16 | 自动确认收货的时间在哪儿改 | 订单设置 | 订单设置 | Y | Y | mall-mbg/src/main/java/com/macro/mall/model/OmsOrderSetting. | 2819 |
| q17 | 看看用户领券用券的记录在哪个页面 | 优惠券领取详情 | 优惠券领取详情 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsCoupon | 2824 |
| q18 | 商品类型分组在哪儿新增一个 | 商品类型 | 商品类型 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsProduc | 2850 |
| q19 | 后台登录接口是哪个类处理的,token是在哪儿签发的 | 登录认证 | 登录认证 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsAdminC | 2839 |
| q20 | JWT过滤器在哪个模块,请求是怎么被拦截校验token的 | 动态权限校验 | 登录认证 | N | Y | mall-security/src/main/java/com/macro/mall/security/componen | 2862 |
| q21 | 访问没有权限的接口时403响应是在哪返回的 | 动态权限校验 | 动态权限校验 | Y | Y | mall-security/src/main/java/com/macro/mall/security/config/S | 1753 |
| q22 | 全局异常是在哪里统一捕获并包装成CommonResult的 | 全局异常与统一返回 | 全局异常与统一返回 | Y | Y | mall-common/src/main/java/com/macro/mall/common/api/CommonRe | 1738 |
| q23 | 动态权限的URL-角色映射数据源是在哪里加载进内存的 | 动态权限校验 | 资源列表 | N | Y | mall-admin/src/main/java/com/macro/mall/service/impl/UmsReso | 2827 |
| q24 | 保存商品时SKU、阶梯价格这些关联数据是怎么一起入库的 | 添加/修改商品 | 添加/修改商品 | Y | Y | mall-admin/src/main/java/com/macro/mall/service/impl/PmsProd | 2822 |
| q25 | 订单分页查询的筛选条件是怎么拼到SQL里的 | 订单列表 | 订单列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/dto/OmsOrderQueryPar | 2822 |
| q26 | 订单详情里修改收货人和费用走的是哪几个接口 | 订单详情 | 订单详情 | Y | Y | mall-admin/src/main/java/com/macro/mall/dto/OmsReceiverInfoP | 2824 |
| q27 | 退货申请从待处理到同意退货的状态流转在哪儿实现的 | 退货申请处理 | 退货申请处理 | Y | Y | mall-mbg/src/main/java/com/macro/mall/model/OmsOrderReturnAp | 2851 |
| q28 | 秒杀商品关联到场次、设置秒杀价格和库存在哪维护 | 秒杀商品管理 | 秒杀商品管理 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsFlashP | 2883 |
| q29 | 优惠券领取记录是在什么时候写库的,对应哪个类的操作 | 优惠券领取详情 | 优惠券领取详情 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsCoupon | 2815 |
| q30 | 角色与资源的多对多绑定关系在哪维护的 | 角色权限分配 | 角色权限分配 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsRoleCo | 2856 |
| q31 | 后台菜单的父子树形结构是在哪儿组装的 | 菜单列表 | 菜单列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsMenuCo | 2863 |
| q32 | 商品分类带子分类的级联列表是怎么一次查出来的 | 商品分类 | 商品分类 | Y | Y | mall-admin/src/main/java/com/macro/mall/service/impl/PmsProd | 2846 |
| q33 | 删除品牌之前有没有校验商品引用,逻辑在哪 | 品牌管理 | 品牌管理 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsBrandC | 2818 |
| q34 | 文件上传用的哪家存储,签名直传的策略在哪生成 | 文件上传 | 文件上传 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/OssContro | 2827 |
| q35 | 后台用户修改自己密码的逻辑在哪个接口里 | 用户列表 | 用户列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/UmsAdminC | 2836 |
| q36 | 运营想把刚上架的新品推到商城首页,用哪个功能 | 新品推荐 | 新品推荐 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsHomeNe | 2820 |
| q37 | 双十一晚上八点要做一场限时抢,时段怎么建 | 秒杀时间段管理 | 秒杀时间段管理 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsFlashP | 2835 |
| q38 | 商品卖断货了想先下架别删链接,后台哪里操作 | 商品列表 | 商品列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsProduc | 2837 |
| q39 | 用户退货理由老是对不上,想加几个常用原因在哪加 | 退货原因设置 | 退货原因设置 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/OmsOrderR | 2864 |
| q40 | 每天打开后台第一眼想看个经营概况,从哪进 | 首页 | 首页 | Y | Y | src/views/home/index.vue | 1664 |
| q41 | 七夕礼盒专题想置顶到首页,用什么功能配 | 专题推荐 | 专题推荐 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsHomeRe | 2824 |
| q42 | 首页品牌墙要换掉一个不合作品牌,去哪改 | 品牌推荐 | 品牌推荐 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsHomeBr | 2826 |
| q43 | 新增了一批订单中心的接口,想把它们归个类,在哪配 | 资源分类 | 订单列表 | N | N | - | 2905 |
| q44 | 商家把主图和详情页都换了,后台哪里能更新这个商品 | 添加/修改商品 | 添加/修改商品 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsProduc | 2730 |
| q45 | 顾客催件了,帮他看看订单走到哪一步、物流到哪了 | 订单列表 | 订单详情 | N | Y | mall-admin/src/main/java/com/macro/mall/controller/OmsOrderC | 2839 |
| q46 | 商品模块里规格参数和它的属性分组分别是哪两个功能,代码都在哪 | 商品类型 | 商品类型 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/PmsProduc | 2818 |
| q47 | 营销中心一张优惠券从创建发放到记录核销,前后端代码涉及哪些文件 | 优惠券列表 | 优惠券领取详情 | N | N | src/views/sms/coupon/index.vue | 2822 |
| q48 | 订单模块售后链路:退货申请进来之后审核处理要走哪些前后端文件 | 退货申请处理 | 退货申请处理 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/OmsOrderR | 2824 |
| q49 | 权限模块里决定账号能访问商品接口的是角色还是资源,绑定关系代码在哪 | 角色权限分配 | 资源列表 | N | N | - | 2831 |
| q50 | 秒杀从建活动、排场次到挂商品整条链路涉及哪些前后端文件 | 秒杀活动列表 | 秒杀活动列表 | Y | Y | mall-admin/src/main/java/com/macro/mall/controller/SmsFlashP | 2832 |

## 失败条目

- q13 「首页banner轮播图在哪儿换图」 期望=广告列表 决策=首页 hit5=false
- q15 「首页新品楼层的数据在哪维护」 期望=新品推荐 决策=品牌推荐 hit5=false
- q20 「JWT过滤器在哪个模块,请求是怎么被拦截校验token的」 期望=动态权限校验 决策=登录认证 hit5=true
- q23 「动态权限的URL-角色映射数据源是在哪里加载进内存的」 期望=动态权限校验 决策=资源列表 hit5=true
- q43 「新增了一批订单中心的接口,想把它们归个类,在哪配」 期望=资源分类 决策=订单列表 hit5=false
- q45 「顾客催件了,帮他看看订单走到哪一步、物流到哪了」 期望=订单列表 决策=订单详情 hit5=true
- q47 「营销中心一张优惠券从创建发放到记录核销,前后端代码涉及哪些文件」 期望=优惠券列表 决策=优惠券领取详情 hit5=false
- q49 「权限模块里决定账号能访问商品接口的是角色还是资源,绑定关系代码在哪」 期望=角色权限分配 决策=资源列表 hit5=false