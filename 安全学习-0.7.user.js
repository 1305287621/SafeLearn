// ==UserScript==
// @name         安全学习
// @namespace    链接
// @version      0.7
// @description  智能检测视频暂停并播放，显示学习时间和当前课程，自动切换下一课
// @author       You
// @match        https://sysaq.sdu.edu.cn/lab-study-front/trainTask/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var checkInterval = 1000; // 检查间隔1秒
    var isAutoPlaying = false; // 防止重复触发
    var hasCompletedAll = false; // 标记是否已完成所有课程

    // 创建时间显示元素
    function createTimeDisplay() {
        var timeDiv = document.createElement('div');
        timeDiv.id = 'safety-video-progress';

        // 设置样式 - 固定在左上角
        timeDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 6px;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
            border: 1px solid #555;
            line-height: 1.4;
            min-width: 250px;
            max-width: 300px;
        `;

        document.body.appendChild(timeDiv);
        return timeDiv;
    }

    // 获取学习时间信息的函数
    function getStudyTimeInfo() {
        try {
            // 获取已学习时间
            var studiedTimeElem = document.querySelector('.alredyTime');
            // 获取要求学习时间
            var totalTimeElem = document.querySelector('.allTime');

            var studiedTime = studiedTimeElem ? studiedTimeElem.textContent.trim() : '未知';
            var totalTime = totalTimeElem ? totalTimeElem.textContent.trim() : '未知';

            return {
                studied: studiedTime,
                total: totalTime,
                isValid: studiedTime !== '未知' && totalTime !== '未知'
            };
        } catch (error) {
            console.log('获取学习时间失败:', error);
            return { studied: '未知', total: '未知', isValid: false };
        }
    }

    // 获取当前选中的课程名称
    function getCurrentCourse() {
        try {
            var activeItem = document.querySelector('.panelItem.activeitem');
            if (activeItem) {
                var itemTitle = activeItem.querySelector('.itemTitle');
                if (itemTitle) {
                    // 获取文本内容并去除"选学"字样和多余空格
                    var fullText = itemTitle.textContent.trim();
                    return fullText.replace('选学', '').trim();
                }
            }
            return '未知课程';
        } catch (error) {
            console.log('获取当前课程失败:', error);
            return '未知课程';
        }
    }

    // 获取当前课程的索引和总课程数
    function getCourseIndexInfo() {
        try {
            var allItems = document.querySelectorAll('.panelItem');
            var activeItem = document.querySelector('.panelItem.activeitem');

            if (!activeItem || allItems.length === 0) {
                return { currentIndex: -1, totalCount: 0 };
            }

            var currentIndex = -1;
            for (var i = 0; i < allItems.length; i++) {
                if (allItems[i] === activeItem) {
                    currentIndex = i;
                    break;
                }
            }

            return {
                currentIndex: currentIndex,
                totalCount: allItems.length,
                isLast: currentIndex === allItems.length - 1
            };
        } catch (error) {
            console.log('获取课程索引失败:', error);
            return { currentIndex: -1, totalCount: 0, isLast: false };
        }
    }

    // 计算学习进度百分比
    function calculateProgress(studied, total) {
        try {
            // 将时间字符串 "00:18" 转换为秒数
            var studiedParts = studied.split(':');
            var totalParts = total.split(':');

            var studiedSeconds = parseInt(studiedParts[0]) * 60 + parseInt(studiedParts[1]);
            var totalSeconds = parseInt(totalParts[0]) * 60 + parseInt(totalParts[1]);

            if (totalSeconds === 0) return 0;

            return Math.round((studiedSeconds / totalSeconds) * 100);
        } catch (error) {
            console.log('计算进度失败:', error);
            return 0;
        }
    }

    // 切换到下一个课程
    function switchToNextCourse() {
        try {
            var indexInfo = getCourseIndexInfo();

            if (indexInfo.isLast) {
                // 已经是最后一个课程
                hasCompletedAll = true;
                console.log('所有课程已完成学习');
                return false;
            }

            // 获取下一个课程元素
            var allItems = document.querySelectorAll('.panelItem');
            var nextItem = allItems[indexInfo.currentIndex + 1];

            if (nextItem) {
                // 模拟点击下一个课程
                nextItem.click();
                console.log('已切换到下一个课程: ' + (indexInfo.currentIndex + 2) + '/' + indexInfo.totalCount);

                // 重置播放状态
                isAutoPlaying = false;

                // 等待页面更新后重新检测
                setTimeout(function() {
                    updateProgressDisplay();
                }, 1000);

                return true;
            }
        } catch (error) {
            console.log('切换课程失败:', error);
        }
        return false;
    }

    // 初始化时间显示元素
    var progressDisplay = createTimeDisplay();

    // 更新进度显示的函数
    function updateProgressDisplay() {
        var timeInfo = getStudyTimeInfo();
        var currentCourse = getCurrentCourse();
        var indexInfo = getCourseIndexInfo();

        if (timeInfo.isValid) {
            var progress = calculateProgress(timeInfo.studied, timeInfo.total);

            // 检查是否完成当前课程
            if (progress >= 100 && !hasCompletedAll) {
                var switched = switchToNextCourse();
                if (!switched && indexInfo.isLast) {
                    // 所有课程已完成
                    progressDisplay.innerHTML = `
                        <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #555; padding-bottom: 5px;">
                            所有课程已完成! 🎉
                        </div>
                        <div style="text-align: center; color: #4CAF50; font-size: 16px; margin: 10px 0;">
                            ✅ 学习任务已完成
                        </div>
                        <div style="font-size: 12px; text-align: center;">
                            共完成 ${indexInfo.totalCount} 个课程
                        </div>
                    `;
                    return;
                }
            }

            var statusText = hasCompletedAll ? '已完成' : `进行中 (${indexInfo.currentIndex + 1}/${indexInfo.totalCount})`;

            progressDisplay.innerHTML = `
                <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #555; padding-bottom: 5px;">
                    当前课程: ${currentCourse}
                </div>
                <div style="font-size: 12px; margin-bottom: 5px; color: #ccc;">
                    状态: ${statusText}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>已学习:</span>
                    <span style="color: #4CAF50; font-weight: bold;">${timeInfo.studied}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>要求学习:</span>
                    <span>${timeInfo.total}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span>完成度:</span>
                    <span style="color: #2196F3; font-weight: bold;">${progress}%</span>
                </div>
                <div style="margin-top: 8px; background: #333; height: 6px; border-radius: 3px;">
                    <div style="background: #4CAF50; height: 100%; width: ${progress}%; border-radius: 3px; transition: width 0.3s;"></div>
                </div>
                ${progress >= 100 && !indexInfo.isLast ? '<div style="margin-top: 8px; color: #FF9800; font-size: 12px; text-align: center;">准备切换下一课程...</div>' : ''}
            `;
        } else {
            progressDisplay.innerHTML = `
                <div style="color: #ff9800; margin-bottom: 5px;">正在获取学习时间信息...</div>
                <div style="font-size: 12px; margin-bottom: 5px;">当前课程: ${currentCourse}</div>
                <div style="font-size: 11px; color: #ccc;">请确保页面已加载完成</div>
            `;
        }
    }

    var timer = setInterval(function() {
        // 更新进度显示
        updateProgressDisplay();

        // 记录每次检查的时间到控制台
        console.log('检查时间:', new Date().toLocaleString());

        // 关闭弹窗
        var closeBtn = document.querySelector('.public_close');
        if (closeBtn) {
            closeBtn.click();
            console.log('检测到弹窗并关闭');
        }

        // 如果已完成所有课程，停止自动播放检测
        if (hasCompletedAll) {
            return;
        }

        // 检测视频是否暂停
        if (window.player && player.paused && !isAutoPlaying) {
            isAutoPlaying = true;
            console.log('检测到视频暂停，开始播放');

            player.play().then(function() {
                console.log('视频已自动播放');
                setTimeout(function() {
                    isAutoPlaying = false;
                }, 3000);
            }).catch(function(error) {
                console.log('播放失败:', error);
                isAutoPlaying = false;
            });
        }
    }, checkInterval);

    // 页面卸载时清理
    window.addEventListener('beforeunload', function() {
        clearInterval(timer);
        if (progressDisplay && progressDisplay.parentNode) {
            progressDisplay.parentNode.removeChild(progressDisplay);
        }
    });

    // 初始显示
    updateProgressDisplay();

    console.log('安全学习助手脚本已加载 - 版本 0.7');
})();