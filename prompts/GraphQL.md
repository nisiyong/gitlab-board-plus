# GitLab Board Plus - GraphQL API 文档

## 概述

本文档描述了 GitLab Board Plus 扩展中使用的 GraphQL API 接口，用于获取项目的各种数据。

**基础请求地址：** `https://{{your-gitlab-url}}/api/graphql`

**通用参数说明：**
- `{{your-gitlab-url}}`: 你的 GitLab 实例地址
- `{{group}}`: 项目所属的组名
- `{{project}}`: 项目名称
- `{{group}}/{{project}}`: 完整的项目路径

## 目录

1. [获取看板列表](#获取看板列表)
2. [获取项目成员列表](#获取项目成员列表)
3. [获取里程碑列表](#获取里程碑列表)
4. [获取标签列表](#获取标签列表)
5. [获取 Issue 列表](#获取-issue-列表)

---

## 获取看板列表

获取项目的所有看板和最近使用的看板。

### 请求体

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

### 响应体

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

---

## 获取项目成员列表

获取项目的所有成员信息，包括用户详情和头像。

### 请求体

```json
[
  {
    "operationName": "searchUsers",
    "variables": {
      "isProject": true,
      "fullPath": "{{group}}/{{project}}",
      "search": ""
    },
    "query": "query searchUsers($fullPath: ID!, $search: String, $isProject: Boolean = false) {\n  group(fullPath: $fullPath) @skip(if: $isProject) {\n    id\n    groupMembers(\n      search: $search\n      relations: [DIRECT, INHERITED, SHARED_FROM_GROUPS]\n    ) {\n      nodes {\n        id\n        user {\n          ...User\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  project(fullPath: $fullPath) @include(if: $isProject) {\n    id\n    projectMembers(search: $search, relations: [DIRECT, INHERITED, INVITED_GROUPS]) {\n      nodes {\n        id\n        user {\n          ...User\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment User on User {\n  id\n  avatarUrl\n  name\n  username\n  __typename\n}\n"
  }
]
```

### 响应体

```json
[
  {
    "data": {
      "project": {
        "id": "gid://gitlab/Project/{{project-id}}",
        "projectMembers": {
          "nodes": [
            {
              "id": "gid://gitlab/ProjectMember/{{project-member-id}}",
              "user": {
                "id": "gid://gitlab/User/{{user-id}}",
                "avatarUrl": "{{user-avatar-url}}",
                "name": "{{user-nickname}}",
                "username": "{{user-username}}",
                "__typename": "UserCore"
              },
              "__typename": "ProjectMember"
            }
          ],
          "__typename": "MemberInterfaceConnection"
        },
        "__typename": "Project"
      }
    }
  }
]
```

### 参数说明

- `search`: 可选的搜索关键词，用于过滤成员
- `isProject`: 布尔值，指定是否为项目级别查询

---

## 获取里程碑列表

获取项目的活跃里程碑列表，按到期日期排序。

### 请求体

```json
[
  {
    "operationName": "searchMilestones",
    "variables": {
      "isProject": true,
      "fullPath": "{{group}}/{{project}}",
      "search": ""
    },
    "query": "query searchMilestones($fullPath: ID!, $search: String, $isProject: Boolean = false) {\n  group(fullPath: $fullPath) @skip(if: $isProject) {\n    id\n    milestones(\n      searchTitle: $search\n      includeAncestors: true\n      includeDescendants: true\n      sort: EXPIRED_LAST_DUE_DATE_ASC\n      state: active\n    ) {\n      nodes {\n        ...Milestone\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  project(fullPath: $fullPath) @include(if: $isProject) {\n    id\n    milestones(\n      searchTitle: $search\n      includeAncestors: true\n      sort: EXPIRED_LAST_DUE_DATE_ASC\n      state: active\n    ) {\n      nodes {\n        ...Milestone\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment Milestone on Milestone {\n  id\n  title\n  __typename\n}\n"
  }
]
```

### 响应体

```json
[
  {
    "data": {
      "project": {
        "id": "gid://gitlab/Project/{{project-id}}",
        "milestones": {
          "nodes": [
            {
              "id": "gid://gitlab/Milestone/{{milestone-id}}",
              "title": "{{milestone-title}}",
              "__typename": "Milestone"
            }
          ],
          "__typename": "MilestoneConnection"
        },
        "__typename": "Project"
      }
    }
  }
]
```

### 参数说明

- `searchTitle`: 可选的搜索关键词，用于过滤里程碑标题
- `includeAncestors`: 包含父级组的里程碑
- `sort`: 排序方式，`EXPIRED_LAST_DUE_DATE_ASC` 表示按到期日期升序排列
- `state`: 里程碑状态，`active` 表示活跃状态

---

## 获取标签列表

获取项目和父级组的所有标签，包含颜色信息。

### 请求体

```json
[
  {
    "operationName": "searchLabels",
    "variables": {
      "isProject": true,
      "fullPath": "{{group}}/{{project}}",
      "search": ""
    },
    "query": "query searchLabels($fullPath: ID!, $search: String, $isProject: Boolean = false) {\n  group(fullPath: $fullPath) @skip(if: $isProject) {\n    id\n    labels(\n      searchTerm: $search\n      includeAncestorGroups: true\n      includeDescendantGroups: true\n    ) {\n      nodes {\n        ...Label\n      }\n    }\n    __typename\n  }\n  project(fullPath: $fullPath) @include(if: $isProject) {\n    id\n    labels(searchTerm: $search, includeAncestorGroups: true) {\n      nodes {\n        ...Label\n      }\n    }\n    __typename\n  }\n}\n\nfragment Label on Label {\n  id\n  color\n  textColor\n  title\n  __typename\n}\n"
  }
]
```

### 响应体

```json
[
  {
    "data": {
      "project": {
        "id": "gid://gitlab/Project/{{project-id}}",
        "labels": {
          "nodes": [
            {
              "id": "gid://gitlab/ProjectLabel/{{label-id}}",
              "color": "#FF9500",
              "textColor": "#FFFFFF",
              "title": "{{label-title}}",
              "__typename": "Label"
            }
          ]
        },
        "__typename": "Project"
      }
    }
  }
]
```

### 参数说明

- `searchTerm`: 可选的搜索关键词，用于过滤标签
- `includeAncestorGroups`: 包含父级组的标签
- `color`: 标签背景颜色（十六进制格式）
- `textColor`: 标签文字颜色（十六进制格式）

---

## 获取 Issue 列表

获取项目的 Issue 列表，包含分页信息、指派人和作者信息。

### 请求体

```json
[
  {
    "operationName": "getIssues",
    "variables": {
      "isProject": true,
      "fullPath": "{{group}}/{{project}}",
      "state": "opened",
      "firstPageSize": 100,
      "types": [
        "ISSUE"
      ]
    },
    "query": "query getIssues($isProject: Boolean = false, $fullPath: ID!, $state: IssuableState, $firstPageSize: Int, $types: [IssueType!]) {\n  project(fullPath: $fullPath) @include(if: $isProject) {\n    id\n    issues(\n      state: $state\n      types: $types\n      first: $firstPageSize\n    ) {\n      pageInfo {\n        hasNextPage\n        hasPreviousPage\n        startCursor\n        endCursor\n        __typename\n      }\n      nodes {\n        id\n        iid\n        title\n        state\n        assignees {\n          nodes {\n            id\n            name\n            username\n            avatarUrl\n            __typename\n          }\n          __typename\n        }\n        author {\n          id\n          name\n          username\n          avatarUrl\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
  }
]
```

### 响应体

```json
[
  {
    "data": {
      "project": {
        "id": "gid://gitlab/Project/{{project-id}}",
        "issues": {
          "pageInfo": {
            "hasNextPage": false,
            "hasPreviousPage": false,
            "startCursor": "{{start-cursor}}",
            "endCursor": "{{end-cursor}}",
            "__typename": "PageInfo"
          },
          "nodes": [
            {
              "id": "gid://gitlab/Issue/{{issue-id}}",
              "iid": "{{issue-iid}}",
              "title": "{{issue-title}}",
              "state": "opened",
              "assignees": {
                "nodes": [
                  {
                    "id": "gid://gitlab/User/{{assignee-user-id}}",
                    "name": "{{assignee-name}}",
                    "username": "{{assignee-username}}",
                    "avatarUrl": "{{assignee-avatar-url}}",
                    "__typename": "UserCore"
                  }
                ],
                "__typename": "UserCoreConnection"
              },
              "author": {
                "id": "gid://gitlab/User/{{author-user-id}}",
                "name": "{{author-name}}",
                "username": "{{author-username}}",
                "avatarUrl": "{{author-avatar-url}}",
                "__typename": "UserCore"
              },
              "__typename": "Issue"
            }
          ],
          "__typename": "IssueConnection"
        },
        "__typename": "Project"
      }
    }
  }
]
```

### 参数说明

- `state`: Issue 状态，可选值：`opened`、`closed`、`all`
- `firstPageSize`: 每页返回的 Issue 数量，建议不超过 100
- `types`: Issue 类型数组，通常为 `["ISSUE"]`
- `iid`: Issue 的内部 ID（在项目内唯一）
- `pageInfo`: 分页信息，用于实现分页加载

### 分页说明

当 `pageInfo.hasNextPage` 为 `true` 时，可以使用 `pageInfo.endCursor` 作为下一页的 `after` 参数来获取更多数据。

---

## 注意事项

1. 所有请求都需要有效的 GitLab 认证令牌
2. 响应中的所有 ID 都是 GitLab 的全局唯一标识符（GID）格式
3. 建议根据实际需要调整 `firstPageSize` 参数以优化性能
4. 某些查询可能需要相应的权限才能访问项目数据