package com.supnum.tp.service;

import com.supnum.tp.dto.PostDTO;
import com.supnum.tp.model.Course;
import com.supnum.tp.model.Post;
import com.supnum.tp.model.User;
import com.supnum.tp.repository.PostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class PostService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CourseService courseService;

    @Autowired
    private UserService userService;

    public List<Post> getPostsForCourse(Long courseId) {
        Course course = courseService.getById(courseId);
        return postRepository.findByCourseOrderByCreatedAtDesc(course);
    }

    public Post createPost(Long courseId, PostDTO dto) {
        Course course = courseService.getById(courseId); 
        User currentUser = userService.getCurrentUser();
        
        if (!course.getTeacher().getId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul le professeur peut publier une annonce.");
        }
        
        Post post = new Post();
        post.setContent(dto.getContent());
        post.setCourse(course);
        post.setAuthor(currentUser);
        return postRepository.save(post);
    }
    
    public void deletePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found"));
        User currentUser = userService.getCurrentUser();
        
        if (!post.getAuthor().getId().equals(currentUser.getId()) && !"ADMIN".equals(currentUser.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Seul l'auteur peut supprimer cette publication.");
        }
        
        postRepository.delete(post);
    }
}
