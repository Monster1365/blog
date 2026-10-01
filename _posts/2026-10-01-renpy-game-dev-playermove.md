---
layout: post
title: "렌파이로 Top-down 방식 게임의 플레이어 움직임을 구현하기"
featured-img: emile-perron-190221
categories: [Renpy, Game, Python]
---

# 1. 들어가며

Ren'Py는 비주얼 노벨 제작에 많이 사용되지만, 화면과 이미지의 위치를 직접 제어하면 간단한 2D 게임도 구현할 수 있다.
이번에는 Ren'Py에서 Top-down 방식의 게임 플레이어 이동을 구현해 보았다.
처음에는 Ren'Py에서 제공하는 viewport를 활용하는 방식으로 접근했지만, 이후 충돌 검사와 같은 기능을 추가하려고 하면서 구조적인 한계에 부딪혔다.
결국 카메라 좌표와 맵 좌표를 분리하고, 키 입력 역시 단순한 이벤트가 아닌 현재 입력 상태로 관리하는 방식으로 구조를 변경했다.

# 2. 구현하려는 것

- Top-down 방식의 맵
- 플레이어가 맵 위를 자유롭게 이동
- 플레이어는 화면 중앙에 고정
- 플레이어가 이동하는 것처럼 보이지만 실제로는 맵이 반대로 이동
- 화살표키를 이용한 이동
- 이후 벽 등의 충돌 검사 추가 가능
- 맵 영역 밖으로 이동하지 못하도록 제한할 수 있는 구조

# 3. 첫 번째 시도 - viewport

## 3-1. 왜 **viewport**를 사용했는가?

Ren'Py에는 화면의 특정 영역을 스크롤할 수 있는 viewport라는 기능 존재한다.
따라서 처음에는 굳이 별도의 카메라 시스템을 만들 필요 없이,

> 기존의 Ren'py 기능인 viewport를 플레이어가 바라보는 영역으로 사용하면 되지 않을까?

라는 생각으로 접근했다.

그렇게 실제로 구현한 코드는 다음과 같다.

```
default camera_x = ui.adjustment()
default camera_y = ui.adjustment()

transform map_zoom:
    zoom 5.0

screen viewport_example():
    button:
        action [Show("main_screen"), Return()]

        viewport id "vp":
            xysize (X_FULL, Y_FULL)
            draggable False
            arrowkeys True

            xadjustment camera_x
            yadjustment camera_y

            add "assets/images/washington.jpg" at map_zoom
```

이때 arrowkeys를 True로 하여서 화살표키를 누르면 이동할 수 있게 하였다.
