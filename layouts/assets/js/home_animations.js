// 首页动画效果

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 为首页添加视差滚动效果
    if (document.body.classList.contains('home')) {
        // 初始化视差效果
        initParallaxEffect();
        
        // 添加滚动监听，用于动画效果
        window.addEventListener('scroll', handleScroll);
        
        // 添加鼠标移动效果
        document.addEventListener('mousemove', handleMouseMove);
        
        // 页面载入完成后的动画序列
        setTimeout(function() {
            triggerPageLoadAnimation();
        }, 100);
    }
});

// 视差滚动效果
function initParallaxEffect() {
    const mainSection = document.querySelector('.main');
    if (mainSection) {
        const parallaxElements = mainSection.querySelectorAll('.post-entry, .profile_inner');
        parallaxElements.forEach(el => {
            el.style.transition = 'transform 0.1s ease-out';
        });
    }
}

// 处理滚动事件
function handleScroll() {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    
    // 视差效果
    const parallaxElements = document.querySelectorAll('.post-entry, .profile_inner');
    parallaxElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const distanceFromCenter = (rect.top + rect.height / 2) - windowHeight / 2;
        const parallaxFactor = 0.03; // 视差因子，控制移动距离
        el.style.transform = `translateY(${distanceFromCenter * parallaxFactor}px)`;
    });
    
    // 滚动时的渐显效果
    const fadeElements = document.querySelectorAll('.post-entry:not(.animated)');
    fadeElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < windowHeight * 0.85) {
            el.classList.add('animated');
            // 这里可以添加其他滚动触发的动画
        }
    });
}

// 鼠标移动效果
function handleMouseMove(e) {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // 计算鼠标位置相对于屏幕中心的偏移
    const xOffset = (mouseX - windowWidth / 2) / (windowWidth / 2);
    const yOffset = (mouseY - windowHeight / 2) / (windowHeight / 2);
    
    // 应用到一些元素上，产生跟随效果
    const followElements = document.querySelectorAll('.profile_inner img, .social-icons a');
    followElements.forEach(el => {
        const factor = 0.03; // 跟随因子
        el.style.transform = `translate(${xOffset * factor * 10}px, ${yOffset * factor * 10}px)`;
    });
}

// 页面载入时的动画序列
function triggerPageLoadAnimation() {
    // 添加一些延迟的动画效果
    const animateSequence = [
        { selector: '.profile_inner', delay: 0, duration: 800 },
        { selector: '.social-icons', delay: 400, duration: 600 },
        { selector: '.buttons', delay: 600, duration: 600 },
        { selector: '.post-entry', delay: 800, duration: 500 }
    ];
    
    animateSequence.forEach(item => {
        setTimeout(() => {
            const elements = document.querySelectorAll(item.selector);
            elements.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                el.style.transition = `opacity ${item.duration}ms ease-out, transform ${item.duration}ms ease-out`;
            });
        }, item.delay);
    });
}

// 添加平滑滚动功能
function enableSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // 减去导航栏高度
                    behavior: 'smooth'
                });
            }
        });
    });
}

// 在DOM加载完成后启用平滑滚动
document.addEventListener('DOMContentLoaded', function() {
    enableSmoothScroll();
});

// 监听窗口大小变化，调整动画效果
window.addEventListener('resize', function() {
    // 可以在这里添加响应式调整
});