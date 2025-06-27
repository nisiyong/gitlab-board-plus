```
https://{{your-gitlab-url}}/api/graphql
```


# 获取 Assignee 列表

## 请求体

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

## 响应体

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

# 获取指派人列表

## 请求体

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

## 响应体

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

# 获取里程碑列表

## 请求体

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

## 响应体

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

# 获取标签列表

## 请求体

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

## 响应体

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

# 获取 Issue 列表

## 请求体

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

## 响应体

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