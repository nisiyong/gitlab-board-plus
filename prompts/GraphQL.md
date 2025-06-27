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