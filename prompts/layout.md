# 目标

- 通过页面加载后，将官方的布局调整成我们期望的布局

# 官方布局

```html
<!-- board 看板-->
<div class="boards-app gl-relative">
    <!-- 看板过滤模块 -->
    <div class="issues-filters">
        <div class="issues-details-filters filtered-search-block gl-display-flex gl-flex-direction-column gl-lg-flex-direction-row row-content-block second-block">
            <!-- 过滤输入控件 -->
            <div class="gl-display-flex gl-flex-direction-column gl-md-flex-direction-row gl-flex-grow-1 gl-lg-mb-0 gl-mb-3 gl-w-full">
                <!-- 看板选择器 -->
                <div data-testid="boards-selector"/>
                <!-- 看板搜索输入框 -->
                <div data-testid="issue-board-filtered-search"/>
            </div>
            <!-- 过滤模块编辑按钮 -->
            <div class="filter-dropdown-container gl-md-display-flex gl-flex-direction-column gl-md-flex-direction-row gl-align-items-flex-start"/>
        </div>
    </div>
    <!-- 看板列表 -->
    <div data-qa-selector="boards_list"/>
    <div class="v-portal" style="display: none;"></div>
</div>
```

# 期望布局

- 新增 boards-tabs 标签，用于切换看板，与官方的 boards-selector 数据一致
- 在 tabs 标签下，分左右布局，左边是快捷过滤模块，右边是官方原有的过滤模块
- 页面加载后 boards-selector 会有一个默认值，这个作为默认 tab 的值
- boards-selector 里有对应的下拉框按钮，需要点击后才能加载其他数据，加载后的数据需要显示在 tabs 标签下

```html
<!-- board 看板-->
<div class="boards-app gl-relative">
    <!-- 看板标签，与 boards-selector 数据一致，用于切换看板-->
    <div data-testid="boards-tabs">
        <!-- 看板快捷过滤模块，在左边 -->
        <div class="issues-filters-shortcuts"/>
        <!-- 看板过滤模块+看板列表，在右边 -->
        <div>
            <!-- 看板过滤模块 -->
            <div class="issues-filters">
                <div class="issues-details-filters filtered-search-block gl-display-flex gl-flex-direction-column gl-lg-flex-direction-row row-content-block second-block">
                    <!-- 过滤输入控件 -->
                    <div class="gl-display-flex gl-flex-direction-column gl-md-flex-direction-row gl-flex-grow-1 gl-lg-mb-0 gl-mb-3 gl-w-full">
                        <!-- 看板选择器 -->
                        <div data-testid="boards-selector"/>
                        <!-- 看板搜索输入框 -->
                        <div data-testid="issue-board-filtered-search"/>
                    </div>
                    <!-- 过滤模块编辑按钮 -->
                    <div class="filter-dropdown-container gl-md-display-flex gl-flex-direction-column gl-md-flex-direction-row gl-align-items-flex-start"/>
                </div>
            </div>
            <!-- 看板列表 -->
            <div data-qa-selector="boards_list"/>
            <div class="v-portal" style="display: none;"></div>
        </div>
    </div>
</div>
```


# 快捷过滤

- 快捷过滤方便用户快速选择条件，对 board list 内容进行过滤
- 其原理是把条件提供给“看板搜索输入框” issue-board-filtered-search，然后通过 issue-board-filtered-search 的值去过滤 board list 内容
- 快捷过滤就是一些简单的按钮，可以支持分组，点击按钮直接触发条件更新，有些按钮也可可以支持多选

菜单示例：
```
- 全部（按钮）
- 指派人（分组，内容数据需要加载）
  - [ ] 我（按钮，默认选中）
  - [ ] 张三（按钮）
  - [ ] 李四（按钮）
- 里程碑（分组，内容数据需要加载）
  - [ ] 1.0（按钮）
  - [ ] 2.0（按钮）
```


## 获取 tab 列表

根据 GraphQL 接口获取 tab 列表

请求地址

```
https://{{your-gitlab-url}}/api/graphql
```

请求体

```json
[
  {
    "operationName": "project_boards",
    "variables": {
      "fullPath": "{{group}}/{{project}}"
    },
    "query": "query project_boards($fullPath: ID!) {\n  project(fullPath: $fullPath) {\n    id\n    boards {\n      edges {\n        node {\n          id\n          name\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
  },
  {
    "operationName": "project_recent_boards",
    "variables": {
      "fullPath": "{{group}}/{{project}}"
    },
    "query": "query project_recent_boards($fullPath: ID!) {\n  project(fullPath: $fullPath) {\n    id\n    recentIssueBoards {\n      edges {\n        node {\n          id\n          name\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
  }
]
```

响应

```json
[
    {
        "data": {
            "project": {
                "id": "gid://gitlab/Project/{{project-id}}",
                "boards": {
                    "edges": [
                        {
                            "node": {
                                "id": "gid://gitlab/Board/{{board-id}}",
                                "name": "{{board-name}}",
                                "__typename": "Board"
                            },
                            "__typename": "BoardEdge"
                        }
                    ],
                    "__typename": "BoardConnection"
                },
                "__typename": "Project"
            }
        }
    },
    {
        "data": {
            "project": {
                "id": "gid://gitlab/Project/{{project-id}}",
                "recentIssueBoards": {
                    "edges": [
                        {
                            "node": {
                                "id": "gid://gitlab/Board/{{board-id}}",
                                "name": "{{board-name}}",
                                "__typename": "Board"
                            },
                            "__typename": "BoardEdge"
                        }
                    ],
                    "__typename": "BoardConnection"
                },
                "__typename": "Project"
            }
        }
    }
]
```