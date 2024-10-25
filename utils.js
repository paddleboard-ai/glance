class Utils {
    calculate_distance(point1, point2) {
        return Math.sqrt(
          Math.pow(point1.x - point2.x, 2) + 
          Math.pow(point1.y - point2.y, 2)
        );
    }
};

export {Utils};