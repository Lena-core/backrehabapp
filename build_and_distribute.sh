#!/bin/bash

# Скрипт для сборки APK и автоматической загрузки в Firebase App Distribution

echo "=== Сборка и загрузка APK в Firebase App Distribution ==="

# Шаг 1: Сборка Release APK
echo ""
echo "Шаг 1: Сборка Release APK..."
cd android && ./gradlew.bat assembleRelease

if [ $? -ne 0 ]; then
    echo "Ошибка при сборке APK!"
    cd ..
    exit 1
fi

# Шаг 2: Загрузка в Firebase App Distribution
echo ""
echo "Шаг 2: Загрузка в Firebase App Distribution..."
./gradlew.bat appDistributionUploadRelease

if [ $? -ne 0 ]; then
    echo "Ошибка при загрузке в Firebase!"
    cd ..
    exit 1
fi

cd ..

echo ""
echo "=== Готово! APK успешно загружен в Firebase App Distribution ==="
echo "Тестировщики получат уведомление о новой версии."
